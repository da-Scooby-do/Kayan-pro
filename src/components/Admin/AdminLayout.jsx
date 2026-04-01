import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import AdminSidebar  from './AdminSidebar'
import AdminOrders   from './AdminOrders'
import AdminSeats    from './AdminSeats'
import AdminSessions from './AdminSessions'
import { useKayan }        from '@/hooks/useKayan'
import { useAdminRealtime } from '@/hooks/useRealtime'
import useKayanStore        from '@/store/useKayanStore'
import { supabase }         from '@/lib/supabase'
import AdminMenu from './AdminMenu'

const VIEWS = {
  orders:   AdminOrders,
  seats:    AdminSeats,
  sessions: AdminSessions,
  menu:     AdminMenu,
}

// ── Admin presence heartbeat ──────────────────────────────────
// Pings Supabase every 60s so the owner can see who's online.
// Also marks offline on unmount (tab close / sign out).
function useAdminPresence() {
  useEffect(() => {
    const ping = async () => {
      try {
        await supabase.rpc('ping_admin_presence')
      } catch { /* silent — presence is non-critical */ }
    }

    // Ping immediately on mount
    ping()

    // Ping every 60 seconds
    const interval = setInterval(ping, 60_000)

    // Mark offline when admin leaves the dashboard
    const goOffline = () => {
      supabase.rpc('set_admin_offline').then(() => {}).catch(() => {})
    }

    window.addEventListener('beforeunload', goOffline)

    return () => {
      clearInterval(interval)
      goOffline()
      window.removeEventListener('beforeunload', goOffline)
    }
  }, [])
}

export default function AdminLayout() {
  const [activeTab, setActiveTab] = useState('orders')
  const { bootstrapAdmin } = useKayan()

  // Realtime order/seat/session channels
  useAdminRealtime()

  // Presence heartbeat — tells the owner this admin is active
  useAdminPresence()

  const { hasNewOrder, setHasNewOrder } = useKayanStore(s => ({
    hasNewOrder:    s.hasNewOrder,
    setHasNewOrder: s.setHasNewOrder,
  }))

  useEffect(() => { bootstrapAdmin() }, []) // eslint-disable-line

  const ActiveView = VIEWS[activeTab]

  return (
    <div className="flex min-h-screen bg-kayan-bg text-kayan-text">
      <AdminSidebar activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 overflow-auto max-h-screen">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0  }}
            exit={{   opacity: 0, y: -6  }}
            transition={{ duration: 0.2 }}
          >
            <ActiveView />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* New-order floating alert */}
      <AnimatePresence>
        {hasNewOrder && (
          <motion.button
            key="new-order-alert"
            initial={{ opacity: 0, y: 24, scale: 0.94 }}
            animate={{ opacity: 1, y: 0,  scale: 1    }}
            exit={{   opacity: 0, y: 16,  scale: 0.94 }}
            onClick={() => { setActiveTab('orders'); setHasNewOrder(false) }}
            className="fixed bottom-5 right-5 z-[9000] text-left cursor-pointer
                       glass border border-kayan-border rounded-2xl px-5 py-4
                       shadow-gold hover:border-kayan-gold/40 transition-all duration-200"
          >
            <p className="text-[8px] text-kayan-gold tracking-[3px] mb-1 uppercase">New Order</p>
            <p className="text-sm font-semibold">🔔 Order received!</p>
            <p className="text-[10px] text-kayan-muted mt-0.5">Tap to view queue</p>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  )
}