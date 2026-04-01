import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'
import { ORDER_STATUS, BILLING, ago } from '@/constants'

// Tick every 60s to refresh the "hours so far" display
function useTick() {
  const [, set] = useState(0)
  useEffect(() => {
    const t = setInterval(() => set(n => n + 1), 60_000)
    return () => clearInterval(t)
  }, [])
}

export default function CustomerBill() {
  const { loadMyOrders, getLiveBill } = useKayan()
  const { mySession, myOrders, myOrdersLoading } = useKayanStore(s => ({
    mySession:        s.mySession,
    myOrders:         s.myOrders,
    myOrdersLoading:  s.myOrdersLoading,
  }))

  const [liveBill, setLiveBill] = useState(null)

  useTick()

  // Load session orders
  useEffect(() => {
    if (mySession?.id) loadMyOrders(mySession.id)
  }, [mySession?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // Poll the live bill every 90s — fall back to client-side calc if RPC fails
  useEffect(() => {
    if (!mySession?.id) return

    const refresh = async () => {
      // Try DB function first (most accurate)
      const dbBill = await getLiveBill(mySession.id)
      if (dbBill) {
        setLiveBill(dbBill)
      } else {
        // Fallback: compute client-side so "Calculating..." never hangs
        const pkg   = mySession.package ?? {}
        const rate  = pkg.hourly_rate ?? 15
        const cap   = pkg.daily_cap   ?? 75
        const capH  = pkg.cap_hours   ?? 6
        const hours = (Date.now() - new Date(mySession.check_in)) / 3_600_000
        const capped = hours > capH
        const stay  = capped ? cap : Math.max(rate, Math.ceil(hours * rate))
        const orders = mySession.orders_total ?? 0
        setLiveBill({
          hours_stayed:  +hours.toFixed(2),
          stay_cost:     stay,
          orders_total:  orders,
          total_cost:    stay + orders,
          is_capped:     capped,
        })
      }
    }

    refresh()
    const t = setInterval(refresh, 90_000)
    return () => clearInterval(t)
  }, [mySession?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── No active session ──────────────────────────────────────
  if (!mySession) {
    return (
      <div className="p-5 animate-fade-in">
        <div className="mb-5">
          <h2 className="font-display text-2xl font-bold mb-1">My Bill</h2>
          <p className="text-kayan-sub text-sm">Current session overview</p>
        </div>
        <div className="glass rounded-2xl border border-white/[0.05] p-10 text-center">
          <p className="text-4xl mb-4">🧾</p>
          <p className="text-kayan-sub text-sm">No active session.</p>
          <p className="text-kayan-muted text-xs mt-1">Ask staff to check you in.</p>
        </div>
      </div>
    )
  }

  const bill = liveBill
  const pkg  = mySession.package ?? {}
  const roomName  = mySession.seat?.room?.name
  const seatNum   = mySession.seat?.seat_number

  const billRows = bill ? [
    { label: 'Stay duration',   value: `${bill.hours_stayed}h`                       },
    { label: 'Hourly rate',     value: `${pkg.hourly_rate ?? BILLING.HOURLY_RATE} EGP/hr` },
    { label: 'Stay cost',       value: `${bill.stay_cost} EGP`,
      note: bill.is_capped ? '(capped ✓)' : null, noteColor: '#22C55E'               },
    { label: 'Drinks & snacks', value: `${bill.orders_total} EGP`                      },
    { divider: true },
    { label: 'Total',           value: `${bill.total_cost} EGP`,
      bold: true, valueColor: '#C9A84C'                                              },
  ] : []

  return (
    <div className="p-5 pb-24 animate-fade-in">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-bold mb-1">My Bill</h2>
        <p className="text-kayan-sub text-sm">Current session overview</p>
      </div>

      {/* Active session card */}
      <div className="glass rounded-2xl border border-kayan-border p-6 mb-4 card-hover">
        {/* Session status */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full bg-green-400"
              style={{ animation: 'pulse2 2s ease-in-out infinite' }}
            />
            <span className="text-xs text-green-400 font-medium">Active Session</span>
          </div>
          {roomName && (
            <span className="text-xs text-kayan-muted">
              {roomName} · Seat #{seatNum}
            </span>
          )}
        </div>

        {/* Big total */}
        <div className="text-center py-5 border-y border-white/[0.05] mb-5">
          <p className="text-[9px] text-kayan-muted tracking-[3px] mb-2 uppercase">
            Current Total
          </p>
          {bill ? (
            <>
              <p className="gold-text font-display text-6xl font-bold">
                {bill.total_cost}
              </p>
              <p className="text-kayan-sub text-sm mt-1">Egyptian Pounds</p>
              {bill.is_capped && (
                <p className="text-green-400 text-xs mt-2">
                  ✓ Daily cap active — staying longer won't cost more
                </p>
              )}
            </>
          ) : (
            <p className="text-kayan-muted text-sm py-4">Calculating…</p>
          )}
        </div>

        {/* Bill breakdown */}
        <div className="space-y-2.5">
          {billRows.map((row, i) =>
            row.divider ? (
              <div key={i} className="border-t border-white/[0.05]" />
            ) : (
              <div key={i} className="flex justify-between items-center">
                <span className={`${row.bold ? 'text-sm font-bold text-kayan-text' : 'text-sm text-kayan-sub'}`}>
                  {row.label}
                  {row.note && (
                    <span className="ml-2 text-[9px] font-semibold" style={{ color: row.noteColor }}>
                      {row.note}
                    </span>
                  )}
                </span>
                <span
                  className={row.bold ? 'text-lg font-bold' : 'text-sm font-medium text-kayan-text'}
                  style={row.valueColor ? { color: row.valueColor } : {}}
                >
                  {row.value}
                </span>
              </div>
            )
          )}
        </div>
      </div>

      {/* Order history */}
      <div>
        <h3 className="text-xs font-semibold text-kayan-sub tracking-wider uppercase mb-3">
          My Orders
        </h3>

        {myOrdersLoading && (
          <p className="text-kayan-muted text-sm text-center py-6">
            Loading orders…
          </p>
        )}

        {!myOrdersLoading && myOrders.length === 0 && (
          <div className="glass rounded-2xl border border-white/[0.05] p-8 text-center">
            <p className="text-kayan-muted text-sm">No orders yet — check the menu!</p>
          </div>
        )}

        <div className="space-y-2">
          {myOrders.map(order => {
            const ss = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending
            return (
              <motion.div
                key={order.id}
                className="flex items-center justify-between px-4 py-3
                           bg-white/[0.024] rounded-xl border border-white/[0.04]"
              >
                <div>
                  <p className="text-sm font-medium">
                    {order.item?.emoji} {order.item?.name ?? 'Item'}
                    {order.quantity > 1 && (
                      <span className="text-kayan-gold text-xs ml-1">×{order.quantity}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-kayan-muted">{ago(order.created_at)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-sm font-semibold text-kayan-gold">
                    {order.total_price} EGP
                  </span>
                  <span
                    className="status-badge"
                    style={{ color: ss.color, background: ss.bg }}
                  >
                    {ss.label}
                  </span>
                </div>
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* Pricing info card */}
      <div className="mt-5 rounded-xl p-4 bg-kayan-gold/[0.04] border border-kayan-gold/[0.12]">
        <p className="text-[9px] text-kayan-muted tracking-[2px] uppercase mb-3">
          Kayan Pricing
        </p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          {[
            { label: 'Hourly rate',      value: `${BILLING.HOURLY_RATE} EGP/hr` },
            { label: 'Daily cap',        value: `${BILLING.DAILY_CAP} EGP`      },
            { label: 'Cap applies after',value: `${BILLING.CAP_HOURS} hours`    },
            { label: 'Orders',           value: 'Billed to tab'                 },
          ].map(x => (
            <div key={x.label}>
              <span className="text-kayan-sub">{x.label}: </span>
              <strong className="text-kayan-gold">{x.value}</strong>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}