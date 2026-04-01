import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import CustomerMap  from './CustomerMap'
import CustomerMenu from './CustomerMenu'
import CustomerBill from './CustomerBill'
import { useKayan }                from '@/hooks/useKayan'
import { useCustomerRealtime, 
         useCustomerSessionWatch } from '@/hooks/useRealtime'
import { useAuth }                 from '@/hooks/useAuth'
import useKayanStore               from '@/store/useKayanStore'

const TABS = [
  { id: 'map',  icon: '🗺', label: 'MAP'  },
  { id: 'menu', icon: '☕', label: 'MENU' },
  { id: 'bill', icon: '🧾', label: 'BILL' },
]

const VIEWS = { map: CustomerMap, menu: CustomerMenu, bill: CustomerBill }

// Loading skeleton for the initial "Memory" sync
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
  const [activeTab, setActiveTab] = useState('map')
  const [bootstrapDone, setBootstrapDone] = useState(false)

  const { bootstrapCustomer } = useKayan()
  const { handleSignOut }     = useAuth()

  const { user, mySession, rooms, profile } = useKayanStore(s => ({
    user:      s.user,
    mySession: s.mySession,
    rooms:     s.rooms,
    profile:   s.profile,
  }))

  // cart count computed directly to stay reactive
  const cart  = useKayanStore(s => s.cart)
  const count = cart.reduce((s, i) => s + i.qty, 0)

  // ── 1. TRIGGERING THE "MEMORY" ON LOAD ──────────────────────
  // This syncs the app state with Supabase as soon as the user is identified
  useEffect(() => {
    if (!user?.id) return
    setBootstrapDone(false)
    
    // Remote Persistence: bootstrapCustomer fetches active session + orders
    bootstrapCustomer(user.id).finally(() => {
      setBootstrapDone(true)
    })
  }, [user?.id, bootstrapCustomer])

  // ── 2. REALTIME WATCHERS ────────────────────────────────────
  // Watch for admin opening/closing THIS customer's session
  useCustomerSessionWatch(user?.id)

  // Watch for order status updates (e.g. coffee is ready)
  useCustomerRealtime(mySession?.id)

  const dataReady  = bootstrapDone && rooms.length > 0
  const ActiveView = VIEWS[activeTab]

  return (
    <div 
      className="min-h-screen flex flex-col bg-kayan-bg text-kayan-text"
      style={{ maxWidth: 540, margin: '0 auto' }}
    >
      {/* Top bar */}
      <header className="glass border-b border-kayan-border px-5 py-3
                         flex items-center justify-between sticky top-0 z-50">
        <div>
          <h1 className="gold-text font-display text-2xl font-bold block leading-none">
            كيان
          </h1>
          <p className="text-[8px] tracking-[3px] text-kayan-gold/40">
            KAYAN WORKSPACE
          </p>
          {profile?.username && (
            <p className="text-[9px] text-kayan-muted font-mono mt-0.5 leading-none">
              @{profile.username}
            </p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Live session status dot (Persistent State Indicator) */}
          {bootstrapDone && (
            <div className="flex items-center gap-1.5">
              <span
                className={`w-2 h-2 rounded-full flex-shrink-0 ${
                  mySession ? 'bg-green-400' : 'bg-kayan-muted'
                }`}
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
      <main className="flex-1 overflow-auto" style={{ paddingBottom: 68 }}>
        {!dataReady ? (
          <BootstrapSkeleton />
        ) : (
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.18 }}
            >
              <ActiveView />
            </motion.div>
          </AnimatePresence>
        )}
      </main>

      {/* Bottom nav */}
      <nav 
        className="glass border-t border-kayan-border fixed bottom-0 left-0 right-0
                   flex z-[60]" 
        style={{ maxWidth: 540, margin: '0 auto' }}
      >
        {TABS.map(tab => {
          const isActive = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 flex flex-col items-center gap-1 cursor-pointer
                border-none bg-transparent transition-colors duration-200 relative
                ${isActive ? 'text-kayan-gold' : 'text-kayan-muted hover:text-kayan-sub'}`}
              style={{ borderBottom: `2px solid ${isActive ? '#C9A84C' : 'transparent'}` }}
            >
              <span className="text-lg">{tab.icon}</span>
              <span className="text-[8px] tracking-widest">{tab.label}</span>

              {/* Cart badge */}
              {tab.id === 'menu' && count > 0 && (
                <motion.span
                  initial={{ scale: 0 }} 
                  animate={{ scale: 1 }}
                  className="absolute top-1 right-[22%] bg-kayan-gold text-kayan-bg
                             text-[8px] font-bold rounded-full w-4 h-4
                             flex items-center justify-center"
                >
                  {count}
                </motion.span>
              )}

              {/* Bill live dot (Alerts user they have an active running tab) */}
              {tab.id === 'bill' && mySession && !isActive && (
                <span 
                  className="absolute top-1.5 right-[26%] w-1.5 h-1.5 rounded-full bg-green-400"
                  style={{ animation: 'pulse2 2s ease-in-out infinite' }} 
                />
              )}
            </button>
          )
        })}
      </nav>
    </div>
  )
}