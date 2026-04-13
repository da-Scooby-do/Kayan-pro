import { useState, useEffect } from 'react'
import useKayanStore from '@/store/useKayanStore'
import RoomTabs from '@/components/Shared/RoomTabs'
import RoomFloorPlan from '@/components/Shared/RoomFloorPlan'

export default function CustomerMap() {
  const rooms = useKayanStore(s => s.rooms)
  const seats = useKayanStore(s => s.seats)

  const [selectedRoomId, setSelectedRoomId] = useState(null)

  useEffect(() => {
    if (rooms.length && !selectedRoomId) setSelectedRoomId(rooms[0].id)
  }, [rooms, selectedRoomId])

  let totFree = 0, totOcc = 0, totCap = 0
  rooms.forEach(r => {
    const rs = seats[r.id] ?? []
    totFree += rs.filter(s => !s.is_occupied).length
    totOcc  += rs.filter(s =>  s.is_occupied).length
    totCap  += r.capacity
  })

  const currentRoom  = rooms.find(r => r.id === selectedRoomId)
  const currentSeats = (seats[selectedRoomId] ?? []).slice().sort((a,b) => a.seat_number - b.seat_number)
  const roomFree     = currentSeats.filter(s => !s.is_occupied).length

  // Occupancy percentage for bar
  const pct = totCap > 0 ? Math.round((totOcc / totCap) * 100) : 0

  return (
    <div className="p-5 animate-fade-in">
      <div className="mb-4">
        <h2 className="font-display text-2xl font-bold mb-0.5">Workspace Map</h2>
        <p className="text-kayan-sub text-sm">Live availability · {totCap} seats total</p>
      </div>

      {/* Global stats — big, tactile */}
      <div className="grid grid-cols-3 gap-2.5 mb-3">
        {[
          { label: 'Free',     value: totFree, color: '#4ade80', bg: 'rgba(34,197,94,0.08)',  border: 'rgba(34,197,94,0.20)'  },
          { label: 'Taken',    value: totOcc,  color: '#f87171', bg: 'rgba(239,68,68,0.08)',  border: 'rgba(239,68,68,0.20)'  },
          { label: 'Total',    value: totCap,  color: '#C9A84C', bg: 'rgba(201,168,76,0.06)', border: 'rgba(201,168,76,0.18)' },
        ].map(x => (
          <div key={x.label}
               className="rounded-2xl py-3.5 text-center flex flex-col items-center"
               style={{ background: x.bg, border: `1px solid ${x.border}` }}>
            <p className="text-3xl font-bold font-display leading-none" style={{ color: x.color }}>{x.value}</p>
            <p className="text-[9px] text-kayan-muted mt-1.5 tracking-wider uppercase font-semibold">{x.label}</p>
          </div>
        ))}
      </div>

      {/* Occupancy bar */}
      <div className="mb-5 mt-3">
        <div className="flex justify-between text-[10px] text-kayan-muted mb-1.5">
          <span>Occupancy</span>
          <span className="font-semibold" style={{ color: pct > 80 ? '#f87171' : pct > 50 ? '#fbbf24' : '#4ade80' }}>
            {pct}%
          </span>
        </div>
        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.06)' }}>
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${pct}%`,
              background: pct > 80 ? '#ef4444' : pct > 50 ? '#f59e0b' : '#22c55e',
            }}
          />
        </div>
      </div>

      <RoomTabs selected={selectedRoomId} onSelect={setSelectedRoomId} />

      {/* Floor plan */}
      {currentRoom && (
        <div className="glass rounded-2xl border border-white/[0.05] p-4">
          {/* Room header */}
          <div className="flex justify-between items-center flex-wrap gap-3 mb-4">
            <div>
              <p className="text-base font-semibold">
                {currentRoom.name}
                <span className="text-kayan-muted text-sm ml-2">{currentRoom.name_ar}</span>
              </p>
              <p className="text-sm font-medium mt-0.5"
                 style={{ color: roomFree > 0 ? '#22C55E' : '#EF4444' }}>
                {roomFree > 0 ? `${roomFree} seats available` : 'Room is full'}
              </p>
            </div>
            <div className="flex gap-4 text-xs text-kayan-sub">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-green-400/60" />Free
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-sm bg-red-400/60" />Taken
              </span>
            </div>
          </div>

          <RoomFloorPlan
            roomId={selectedRoomId}
            seats={currentSeats}
            isAdmin={false}
          />
        </div>
      )}
    </div>
  )
}