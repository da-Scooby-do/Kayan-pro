import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'
import Avatar from '@/components/Shared/Avatar'
import CheckoutModal from '@/components/Shared/CheckoutModal'
import AdminOpenSession from './AdminOpenSession'
import { calcBill } from '@/constants'

function useTick(ms = 60_000) {
  const [, setTick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => setTick(n => n + 1), ms)
    return () => clearInterval(t)
  }, [ms])
}

export default function AdminSessions() {
  const { loadActiveSessions } = useKayan()
  const { sessions, sessionsLoading } = useKayanStore(s => ({
    sessions:        s.sessions,
    sessionsLoading: s.sessionsLoading,
  }))

  const [checkoutTarget,  setCheckoutTarget]  = useState(null)
  const [showOpenSession, setShowOpenSession] = useState(false)

  useTick()
  useEffect(() => { loadActiveSessions() }, []) // eslint-disable-line

  return (
    <div className="p-7 max-w-3xl animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-[9px] text-kayan-muted tracking-[3px] mb-1 uppercase">Admin · Billing</p>
          <h2 className="font-display text-3xl font-bold mb-1">Active Sessions</h2>
          <p className="text-kayan-sub text-sm">
            {sessions.length > 0
              ? `${sessions.length} session${sessions.length !== 1 ? 's' : ''} active right now`
              : 'No active sessions — check someone in to get started'}
          </p>
        </div>
        <button onClick={() => setShowOpenSession(true)} className="btn-gold flex items-center gap-2">
          <span className="text-lg leading-none">+</span> Open Session
        </button>
      </div>

      {/* Stats */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-3 mb-7">
          {[
            { label: 'Active', value: sessions.length, color: '#C9A84C', sub: 'sessions' },
            {
              label: 'Est. Revenue',
              value: sessions.reduce((s, x) => s + calcBill(x.check_in, x.orders_total ?? 0, x.package ?? {}).total, 0) + ' EGP',
              color: '#22C55E', sub: 'if all checkout now',
            },
            {
              label: 'Capped',
              value: sessions.filter(x => calcBill(x.check_in, 0, x.package ?? {}).capped).length,
              color: '#818CF8', sub: 'on daily cap',
            },
          ].map(x => (
            <div key={x.label} className="glass rounded-2xl p-4 border border-white/[0.05]">
              <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-1.5">{x.label}</p>
              <p className="font-display text-2xl font-bold" style={{ color: x.color }}>{x.value}</p>
              <p className="text-[10px] text-kayan-muted mt-0.5">{x.sub}</p>
            </div>
          ))}
        </div>
      )}

      {sessionsLoading && (
        <div className="text-center py-16 text-kayan-muted text-sm">Loading sessions…</div>
      )}

      {!sessionsLoading && sessions.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-kayan-border p-12 text-center"
        >
          <div className="text-5xl mb-4">🪑</div>
          <p className="font-display text-xl font-semibold mb-2">No Active Sessions</p>
          <p className="text-kayan-sub text-sm mb-6 max-w-xs mx-auto">
            Open a session to check a customer in and start tracking their time and orders.
          </p>
          <button onClick={() => setShowOpenSession(true)} className="btn-gold mx-auto">
            + Open First Session
          </button>
        </motion.div>
      )}

      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {sessions.map(session => {
            const bill = calcBill(session.check_in, session.orders_total ?? 0, session.package ?? {})
            return (
              <motion.div
                key={session.id} layout
                initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97, y: -6 }}
              className="glass rounded-2xl border border-kayan-border p-6 card-hover"
              >
                <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <Avatar initial={(session.customer_name ?? 'G')[0]} size={48} />
                    <div>
                      <p className="text-base font-semibold">{session.customer_name}</p>
                      <p className="text-xs text-kayan-sub">
                        {session.room_name} · Seat {session.seat_id?.split('-')[1]}
                      </p>
                      <p className="text-[9px] text-kayan-muted mt-0.5 flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-green-400 inline-block"
                              style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
                        {bill.hoursLabel} elapsed
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-display text-3xl font-bold text-kayan-gold">
                      {bill.total}<span className="text-sm ml-1 font-normal">EGP</span>
                    </p>
                    <p className="text-xs text-kayan-muted mt-0.5">
                      {bill.stayCost} stay + {bill.ordersTotal} orders
                    </p>
                    {bill.capped && (
                      <p className="text-[9px] text-green-400 mt-1 tracking-wide">✓ DAILY CAP ACTIVE</p>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap bg-white/[0.025] rounded-xl px-3 py-2.5 mb-4">
                  {[
                    { label: 'Duration',  value: bill.hoursLabel },
                    { label: 'Stay Cost', value: `${bill.stayCost} EGP`, color: bill.capped ? '#22C55E' : null },
                    { label: 'Orders',    value: `${bill.ordersTotal} EGP` },
                  ].map((item, i) => (
                    <div key={item.label} className="flex-1 min-w-[80px] px-2 py-1"
                         style={{ borderLeft: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}>
                      <p className="text-[9px] text-kayan-muted tracking-wide uppercase mb-1">{item.label}</p>
                      <p className="text-sm font-semibold" style={{ color: item.color ?? '#F0EBE0' }}>{item.value}</p>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setCheckoutTarget(session)}
                  className="w-full py-3 rounded-xl font-bold text-sm text-kayan-gold
                             bg-gradient-to-r from-kayan-gold/15 to-kayan-gold/[0.06]
                             border border-kayan-border hover:border-kayan-gold/40
                             transition-all duration-200 cursor-pointer"
                >
                  Process Checkout — {bill.total} EGP →
                </button>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {showOpenSession && (
        <AdminOpenSession
          onClose={() => setShowOpenSession(false)}
          onSuccess={() => loadActiveSessions()}
        />
      )}

      {checkoutTarget && (
        <CheckoutModal
          session={checkoutTarget}
          onClose={() => setCheckoutTarget(null)}
          onSuccess={() => { setCheckoutTarget(null); loadActiveSessions() }}
        />
      )}
    </div>
  )
}