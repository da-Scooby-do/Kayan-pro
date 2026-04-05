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

  return (
    <div className="p-5 animate-fade-in">
      <div className="mb-5">
        <h2 className="font-display text-2xl font-bold mb-1">Workspace Map</h2>
        <p className="text-kayan-sub text-sm">
          Live seat availability · Real room layout
        </p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Available', value: totFree, color: '#22C55E' },
          { label: 'Occupied',  value: totOcc,  color: '#EF4444' },
          { label: 'Total',     value: totCap,  color: '#C9A84C' },
        ].map(x => (
          <div key={x.label}
               className="glass rounded-2xl border border-white/[0.05] py-3 text-center">
            <p className="text-2xl font-bold" style={{ color: x.color }}>{x.value}</p>
            <p className="text-[9px] text-kayan-muted mt-1 tracking-wider uppercase">{x.label}</p>
          </div>
        ))}
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