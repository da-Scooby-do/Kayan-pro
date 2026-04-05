import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'
import Pill from '@/components/Shared/Pill'
import Avatar from '@/components/Shared/Avatar'
import { ORDER_STATUS, ORDER_NEXT_STATUS, ORDER_NEXT_LABEL, ago } from '@/constants'

const STATUS_TABS = ['all', 'pending', 'preparing', 'ready']

export default function AdminOrders() {
  const { loadPendingOrders, handleUpdateOrderStatus } = useKayan()
  const { orders, ordersLoading } = useKayanStore(s => ({
    orders:        s.orders,
    ordersLoading: s.ordersLoading,
  }))

  const [activeTab, setActiveTab] = useState('all')

  useEffect(() => { loadPendingOrders() }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const filtered = activeTab === 'all'
    ? orders
    : orders.filter(o => o.status === activeTab)

  const counts = {
    pending:   orders.filter(o => o.status === 'pending').length,
    preparing: orders.filter(o => o.status === 'preparing').length,
    ready:     orders.filter(o => o.status === 'ready').length,
  }

  return (
    <div className="p-7 max-w-3xl animate-fade-in">
      <div className="mb-6">
        <p className="text-[9px] text-kayan-muted tracking-[3px] mb-1 uppercase">Admin · Real-time</p>
        <h2 className="font-display text-3xl font-bold mb-1">Order Queue</h2>
        <p className="text-kayan-sub text-sm">Live orders from active sessions</p>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-6">
        <Pill label="Pending"   value={counts.pending}   valueColor="rgba(245,158,11,.9)"  sub="Need attention" />
        <Pill label="Preparing" value={counts.preparing} valueColor="rgba(129,140,248,.9)" sub="In progress"    />
        <Pill label="Ready"     value={counts.ready}     valueColor="rgba(34,197,94,.9)"   sub="To collect"     />
      </div>

      <div className="flex gap-2 mb-5 pb-4 border-b border-white/[0.05]">
        {STATUS_TABS.map(t => (
          <button key={t} onClick={() => setActiveTab(t)}
            className={`kayan-tab ${activeTab === t ? 'active' : ''}`}>
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {ordersLoading && (
        <div className="text-center py-16 text-kayan-muted text-sm">Loading orders…</div>
      )}

      <div className="flex flex-col gap-3">
        <AnimatePresence initial={false}>
          {filtered.length === 0 && !ordersLoading && (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-16 text-kayan-muted text-sm">
              No {activeTab === 'all' ? '' : activeTab} orders right now.
            </motion.div>
          )}

          {filtered.map(order => {
            const ss         = ORDER_STATUS[order.status] ?? ORDER_STATUS.pending
            const nextStatus = ORDER_NEXT_STATUS[order.status]
            const nextLabel  = ORDER_NEXT_LABEL[order.status]

            return (
              <motion.div key={order.id} layout
                initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.22 }}
                className="glass rounded-2xl border border-white/[0.05] p-4 flex items-center gap-4 flex-wrap">

                <Avatar initial={(order.customer_name ?? 'G')[0]} size={44} />

                <div className="flex-1 min-w-[100px]">
                  {/* Name + unique code */}
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold">{order.customer_name ?? 'Guest'}</p>
                    {order.customer_username && (
                      <span className="text-[9px] text-kayan-muted bg-white/[0.04] px-1.5 py-0.5 rounded-md font-mono tracking-wide">
                        {order.customer_username}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-kayan-sub">
                    {order.emoji} {order.item_name}
                    {order.quantity > 1 && (
                      <span className="ml-1 text-kayan-gold font-semibold">×{order.quantity}</span>
                    )}
                  </p>
                  <p className="text-[10px] text-kayan-muted mt-0.5">
                    {order.room_name} · Seat {order.seat_number ?? order.seat_id?.slice(0, 6)}
                  </p>
                </div>

                <div className="text-center min-w-[60px]">
                  <p className="text-base font-bold text-kayan-gold">
                    {order.total_price}<span className="text-[10px] ml-0.5">EGP</span>
                  </p>
                  <p className="text-[10px] text-kayan-muted">{ago(order.created_at)}</p>
                </div>

                <span className="status-badge" style={{ color: ss.color, background: ss.bg }}>
                  {ss.label}
                </span>

                {nextStatus && (
                  <button onClick={() => handleUpdateOrderStatus(order.id, nextStatus)}
                    className="btn-ghost text-xs px-3 py-1.5 text-kayan-gold border-kayan-border">
                    {nextLabel}
                  </button>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </div>
  )
}