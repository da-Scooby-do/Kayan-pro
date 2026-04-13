import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CustomerMap          from './CustomerMap'
import CustomerMenu         from './CustomerMenu'
import CustomerBill         from './CustomerBill'
import CustomerSubscription from './CustomerSubscription'
import { useKayan }                from '@/hooks/useKayan'
import { useCustomerRealtime,
         useCustomerSessionWatch,
         useCustomerSeatsRealtime,
         useCustomerSubscriptionWatch,
         useCustomerMenuWatch } from '@/hooks/useRealtime'
import { useAuth }                 from '@/hooks/useAuth'
import useKayanStore               from '@/store/useKayanStore'

const TABS = [
  { id: 'map',  icon: '🗺', label: 'MAP'  },
  { id: 'menu', icon: '☕', label: 'MENU' },
  { id: 'bill', icon: '🧾', label: 'BILL' },
  { id: 'sub',  icon: '✦',  label: 'SUB'  },
]

const VIEWS = { map: CustomerMap, menu: CustomerMenu, bill: CustomerBill, sub: CustomerSubscription }

function Shimmer({ className = '' }) {
  return <div className={`rounded-xl bg-white/[0.04] animate-pulse ${className}`} />
}

function BootstrapSkeleton() {
  return (
    <div className="p-5 space-y-4 animate-fade-in">
      <Shimmer className="h-7 w-40" />
      <Shimmer className="h-4 w-56" />
      <div className="grid grid-cols-3 gap-3 pt-2">
        <Shimmer className="h-20" />
        <Shimmer className="h-20" />
        <Shimmer className="h-20" />
      </div>
      <div className="flex gap-2 pt-2">
        {[1,2,3,4].map(i => <Shimmer key={i} className="h-7 w-16 rounded-full" />)}
      </div>
      <Shimmer className="h-48 rounded-2xl" />
    </div>
  )
}

export default function CustomerLayout() {
  const [activeTab,     setActiveTab]     = useState('map')
  const [bootstrapDone, setBootstrapDone] = useState(false)

  const { bootstrapCustomer } = useKayan()
  const { handleSignOut }     = useAuth()

  const user      = useKayanStore(s => s.user)
  const mySession = useKayanStore(s => s.mySession)
  const rooms     = useKayanStore(s => s.rooms)
  const profile   = useKayanStore(s => s.profile)
  const cart      = useKayanStore(s => s.cart)
  const count     = cart.reduce((s, i) => s + i.qty, 0)

  // ── 1. Bootstrap on mount ───────────────────────────────────
  useEffect(() => {
    if (!user?.id) return

    // If rooms already loaded (e.g. tab switch), skip skeleton
    if (rooms.length > 0) {
      setBootstrapDone(true)
      return
    }

    setBootstrapDone(false)

    // Safety net — never hang > 6s regardless of network
    const timeout = setTimeout(() => setBootstrapDone(true), 6000)

    bootstrapCustomer(user.id).finally(() => {
      clearTimeout(timeout)
      setBootstrapDone(true)
    })

    return () => clearTimeout(timeout)
  }, [user?.id]) // eslint-disable-line

  // ── 2. Watch for admin opening/closing this customer's session
  useCustomerSessionWatch(user?.id)

  // ── 3. Watch for order status updates
  useCustomerRealtime(mySession?.id)

  // ── 4. Watch for seat occupancy changes (live map) — BUG-1 FIX
  useCustomerSeatsRealtime()

  // ── 5. Watch for menu changes (availability toggle, add, delete) ──
  // Reloads menu instantly so unavailable items vanish without refresh.
  useCustomerMenuWatch()

  // ── 6. Watch for subscription activation by admin ────────────
  // Refreshes mySubscription + mySession when admin activates a sub
  // after the customer is already in the app (no page refresh needed).
  useCustomerSubscriptionWatch(user?.id)

  // Show content once bootstrap done OR rooms already exist
  const dataReady  = bootstrapDone || rooms.length > 0
  const ActiveView = VIEWS[activeTab]

  return (
    <div className="min-h-screen flex flex-col bg-kayan-bg text-kayan-text"
         style={{ maxWidth: 540, margin: '0 auto' }}>

      {/* Top bar */}
      <header className="glass border-b border-kayan-border px-5 py-3
                         flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="gold-text font-display text-2xl font-bold block leading-none">كيان</h1>
          <p className="text-[8px] tracking-[3px] text-kayan-gold/40">KAYAN · ALEXANDRIA</p>
          {profile?.username && (
            <p className="text-[9px] text-kayan-muted font-mono leading-none mt-0.5">
              {profile.username}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Live session status dot */}
          {bootstrapDone && (
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${mySession ? 'bg-green-400' : 'bg-kayan-muted'}`}
                style={mySession ? { animation: 'pulse2 2s ease-in-out infinite' } : {}}
              />
              <span className="text-[10px] text-kayan-sub">
                {mySession ? 'Session active' : 'No session'}
              </span>
            </div>
          )}
          <button onClick={handleSignOut} className="btn-ghost text-xs px-3 py-1.5">
            ← Exit
          </button>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-auto" style={{ paddingBottom: 76 }}>
        {!dataReady ? (
          <BootstrapSkeleton />
        ) : (
          <AnimatePresence>
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.18 }}
            >
              <ActiveView />
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Bottom nav — bigger tap targets, active gold pill under icon */}
      <nav className="customer-bottom-nav"
           style={{ left: '50%', transform: 'translateX(-50%)', maxWidth: 540 }}>
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`customer-nav-btn ${isActive ? 'active' : ''}`}
            >
              {/* Active gold pill sits behind the icon */}
              {isActive && (
                <motion.span
                  layoutId="nav-pill"
                  className="customer-nav-pill"
                  transition={{ type: 'spring', stiffness: 420, damping: 38 }}
                />
              )}
              <span className="customer-nav-icon">{tab.icon}</span>
              <span className="customer-nav-label">{tab.label}</span>

              {/* Cart badge */}
              {tab.id === 'menu' && count > 0 && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  className="customer-nav-badge"
                >
                  {count}
                </motion.span>
              )}

              {/* Bill live dot */}
              {tab.id === 'bill' && mySession && !isActive && (
                <span className="customer-nav-dot"
                      style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}
