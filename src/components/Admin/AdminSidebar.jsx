import { motion } from 'framer-motion'
import useKayanStore from '@/store/useKayanStore'
import { useAuth } from '@/hooks/useAuth'

const NAV_ITEMS = [
  { id: 'orders',   icon: '🔔', label: 'Order Queue' },
  { id: 'seats',    icon: '🪑', label: 'Seat Map'    },
  { id: 'sessions', icon: '⏱', label: 'Sessions'    },
  { id: 'menu',     icon: '☕', label: 'Menu Items' },
]

export default function AdminSidebar({ activeTab, onTabChange }) {
  const { handleSignOut } = useAuth()
  const profile = useKayanStore(s => s.profile)
  const orders  = useKayanStore(s => s.orders)
  const rooms   = useKayanStore(s => s.rooms)
  const seats   = useKayanStore(s => s.seats)

  const pendingCount = orders.filter(o => o.status === 'pending').length

  return (
    <aside
      className="glass border-r border-kayan-border flex flex-col"
      style={{ width: 200, flexShrink: 0, height: '100vh', position: 'sticky', top: 0 }}
    >
      {/* Logo */}
      <div className="p-5 pb-4 border-b border-white/[0.05]">
        <p className="text-[8px] tracking-[4px] text-kayan-muted mb-2 uppercase">
          KAYAN · ADMIN
        </p>
        <h1 className="gold-text font-display text-3xl font-bold block leading-none">
          كيان
        </h1>
        <p className="text-[8px] tracking-[4px] text-kayan-gold/40 mt-0.5">
          KAYAN
        </p>
      </div>

      {/* Admin info */}
      <div className="px-4 py-3 border-b border-white/[0.05]">
        <p className="text-xs font-semibold text-kayan-text truncate">
          {profile?.full_name ?? 'Admin'}
        </p>
        <p className="text-[10px] text-kayan-muted capitalize">
          {profile?.role ?? 'admin'}
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-2 overflow-y-auto">
        {NAV_ITEMS.map(item => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`sidebar-item w-full text-left relative ${activeTab === item.id ? 'active' : ''}`}
          >
            <span className="text-base">{item.icon}</span>
            <span>{item.label}</span>

            {item.id === 'orders' && pendingCount > 0 && (
              <motion.span
                animate={{ scale: [1, 1.15, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="absolute right-2 bg-red-500 text-white rounded-full px-1.5 text-[9px] font-bold"
              >
                {pendingCount}
              </motion.span>
            )}
          </button>
        ))}
      </nav>

      {/* Room occupancy bars */}
      <div className="px-4 py-3 border-t border-white/[0.05]">
        <p className="text-[8px] text-kayan-muted tracking-[2px] mb-3 uppercase">
          Rooms
        </p>
        {rooms.map(r => {
          const roomSeats = seats[r.id] ?? []
          const occ = roomSeats.filter(s => s.is_occupied).length
          const pct = r.capacity > 0 ? Math.round((occ / r.capacity) * 100) : 0
          const barColor =
            pct > 80 ? '#EF4444' : pct > 50 ? '#F59E0B' : '#22C55E'

          return (
            <div key={r.id} className="mb-2">
              <div className="flex justify-between text-[9px] mb-1">
                <span className="text-kayan-sub">{r.name}</span>
                <span style={{ color: barColor }}>
                  {occ}/{r.capacity}
                </span>
              </div>
              <div className="h-[2px] rounded-full bg-white/[0.05]">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, background: barColor }}
                />
              </div>
            </div>
          )
        })}
      </div>

      {/* Sign out */}
      <div className="p-3 border-t border-white/[0.05]">
        <button
          onClick={handleSignOut}
          className="w-full py-2 rounded-xl text-[10px] tracking-widest text-kayan-muted
                     border border-white/[0.05] hover:border-white/10 hover:text-kayan-sub
                     transition-all duration-200 cursor-pointer bg-transparent"
        >
          ← SIGN OUT
        </button>
      </div>
    </aside>
  )
}