import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'
import Pill from '@/components/Shared/Pill'
import RoomTabs from '@/components/Shared/RoomTabs'
import SeatGrid from '@/components/Shared/SeatGrid'
import ChangeSeatModal from './ChangeSeatModal'

export default function AdminSeats() {
  const { loadSeats, handleToggleSeat } = useKayan()
  const { rooms, seats } = useKayanStore(s => ({
    rooms: s.rooms,
    seats: s.seats,
  }))

  const [selectedRoomId,  setSelectedRoomId]  = useState(null)
  const [changeSeatTarget, setChangeSeatTarget] = useState(null) // occupied seat clicked

  useEffect(() => {
    if (rooms.length && selectedRoomId === null) setSelectedRoomId(rooms[0].id)
  }, [rooms, selectedRoomId])

  useEffect(() => { loadSeats() }, []) // eslint-disable-line

  let totFree = 0, totOcc = 0, totCap = 0
  rooms.forEach(r => {
    const rs = seats[r.id] ?? []
    totFree += rs.filter(s => !s.is_occupied).length
    totOcc  += rs.filter(s =>  s.is_occupied).length
    totCap  += r.capacity
  })

  const currentRoom  = rooms.find(r => r.id === selectedRoomId)
  const currentSeats = seats[selectedRoomId] ?? []
  const roomFree     = currentSeats.filter(s => !s.is_occupied).length
  const roomOcc      = currentSeats.filter(s =>  s.is_occupied).length

  // Routing logic:
  // • Free seat            → toggle to occupied (manual mark)
  // • Occupied + session   → open Change Seat modal
  // • Occupied, no session → toggle back to free (undo manual mark)
  const onSeatClick = (seat) => {
    if (!seat.is_occupied) {
      // Free → mark as occupied
      handleToggleSeat(seat.id, seat.room_id, seat.is_occupied)
    } else if (seat.current_session_id) {
      // Has a real customer session → show Change Seat modal
      setChangeSeatTarget({
        ...seat,
        room_name: currentRoom?.name,
      })
    } else {
      // Manually toggled, no session → toggle back to free
      handleToggleSeat(seat.id, seat.room_id, seat.is_occupied)
    }
  }

  return (
    <div className="p-7 animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[9px] text-kayan-muted tracking-[3px] mb-1 uppercase">
          Admin · Workspace
        </p>
        <h2 className="font-display text-3xl font-bold mb-1">Seat Management</h2>
        <p className="text-kayan-sub text-sm">
          Click a <span className="text-green-400 font-medium">green seat</span> to mark it occupied ·
          Click a <span className="text-red-400 font-medium">red seat</span> to move the customer
        </p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <Pill label="Available" value={totFree} valueColor="rgba(34,197,94,.9)" sub={`of ${totCap} total`} />
        <Pill label="Occupied"  value={totOcc}  valueColor="rgba(239,68,68,.9)" sub="Active seats"         />
        <Pill label="Occupancy" value={totCap > 0 ? `${Math.round((totOcc / totCap) * 100)}%` : '—'} sub="All rooms" />
      </div>

      <RoomTabs selected={selectedRoomId} onSelect={setSelectedRoomId} />

      {/* Room card */}
      {currentRoom && (
        <div className="glass rounded-2xl border border-kayan-border p-5 mb-5"
             style={{ animation: 'glow 5s ease-in-out infinite' }}>

          <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
            <div>
              <h3 className="font-display text-xl font-semibold">{currentRoom.name}</h3>
              <p className="text-kayan-muted text-sm">
                {currentRoom.name_ar} · Capacity {currentRoom.capacity}
              </p>
            </div>
            <div className="flex gap-5">
              <div className="text-center">
                <p className="text-2xl font-bold text-green-400">{roomFree}</p>
                <p className="text-[9px] text-kayan-muted tracking-wider uppercase">Free</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{roomOcc}</p>
                <p className="text-[9px] text-kayan-muted tracking-wider uppercase">Occupied</p>
              </div>
            </div>
          </div>

          <SeatGrid
            seats={currentSeats}
            isAdmin={true}
            onToggle={onSeatClick}
          />
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-5 text-xs text-kayan-sub">
        {[
          { color: '#22C55E', label: 'Free — click to mark occupied'          },
          { color: '#EF4444', label: 'Occupied (session) — click to move'     },
          { color: '#EF4444', label: 'Occupied (manual) — click again to free', opacity: '0.45' },
        ].map(x => (
          <div key={x.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0"
                 style={{ background: x.color, opacity: x.opacity ?? 0.75 }} />
            {x.label}
          </div>
        ))}
      </div>

      {/* Change Seat Modal */}
      <AnimatePresence>
        {changeSeatTarget && (
          <ChangeSeatModal
            occupiedSeat={changeSeatTarget}
            onClose={() => setChangeSeatTarget(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}