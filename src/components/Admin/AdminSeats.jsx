import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'
import Pill from '@/components/Shared/Pill'
import RoomTabs from '@/components/Shared/RoomTabs'
import RoomFloorPlan from '@/components/Shared/RoomFloorPlan'
import ChangeSeatModal from './ChangeSeatModal'
import AdminOpenSession from './AdminOpenSession'

export default function AdminSeats() {
  const { loadSeats, handleToggleSeat, handleToggleRoomClosed } = useKayan()
  const rooms = useKayanStore(s => s.rooms)
  const seats = useKayanStore(s => s.seats)

  const [selectedRoomId,    setSelectedRoomId]    = useState(null)
  const [changeSeatTarget,  setChangeSeatTarget]  = useState(null)
  const [openSessionSeatId, setOpenSessionSeatId] = useState(null)
  const [closingRoom,       setClosingRoom]       = useState(false)

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
  const currentSeats = (seats[selectedRoomId] ?? []).slice().sort((a,b) => a.seat_number - b.seat_number)
  const roomFree     = currentSeats.filter(s => !s.is_occupied).length
  const roomOcc      = currentSeats.filter(s =>  s.is_occupied).length

  const onSeatClick = (seat) => {
    if (currentRoom?.is_closed) return  // room is closed — no actions allowed
    if (!seat.is_occupied) {
      // Open the full check-in flow with this seat pre-selected
      setOpenSessionSeatId(seat.id)
    } else if (seat.current_session_id) {
      // Occupied with a live session — offer seat transfer
      setChangeSeatTarget({ ...seat, room_name: currentRoom?.name })
    } else {
      // Manually marked occupied (no session) — just free it
      handleToggleSeat(seat.id, seat.room_id, seat.is_occupied)
    }
  }

  return (
    <div className="p-7 animate-fade-in">

      <div className="mb-6">
        <p className="text-[9px] text-kayan-muted tracking-[3px] mb-1 uppercase">
          Admin · Workspace
        </p>
        <h2 className="font-display text-3xl font-bold mb-1">Seat Management</h2>
        <p className="text-kayan-sub text-sm">
          <span className="text-green-400">Green seat</span> — click to open a session ·
          <span className="text-red-400 ml-1">Red seat</span> — click to move customer
        </p>
      </div>

      {/* Global stats */}
      <div className="grid grid-cols-3 gap-3 mb-7">
        <Pill label="Available" value={totFree} valueColor="rgba(34,197,94,.9)"  sub={`of ${totCap} total`} />
        <Pill label="Occupied"  value={totOcc}  valueColor="rgba(239,68,68,.9)"  sub="Active seats"         />
        <Pill label="Occupancy" value={totCap > 0 ? `${Math.round((totOcc/totCap)*100)}%` : '—'} sub="All rooms" />
      </div>

      <RoomTabs selected={selectedRoomId} onSelect={setSelectedRoomId} />

      {/* Floor plan */}
      {currentRoom && (
        <div className="glass rounded-2xl border border-kayan-border p-5 mb-5 card-hover">

          <div className="flex items-start justify-between flex-wrap gap-3 mb-5">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-display text-xl font-semibold">
                  {currentRoom.name}
                  <span className="text-kayan-muted text-sm ml-2 font-normal">
                    {currentRoom.name_ar}
                  </span>
                </h3>
                {currentRoom.is_closed && (
                  <span className="text-[9px] font-bold text-red-400 bg-red-500/10
                                   border border-red-500/30 px-2 py-0.5 rounded-full">
                    🔒 CLOSED
                  </span>
                )}
              </div>
              <p className="text-kayan-muted text-sm mt-0.5">
                Capacity {currentRoom.capacity} seats
                {currentRoom.closed_reason && (
                  <span className="ml-2 text-red-400/70">· {currentRoom.closed_reason}</span>
                )}
              </p>
            </div>
            <div className="flex items-center gap-4">
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
              {/* Close / Open room button */}
              <button
                disabled={closingRoom}
                onClick={async () => {
                  setClosingRoom(true)
                  await handleToggleRoomClosed(
                    currentRoom.id,
                    !currentRoom.is_closed,
                    currentRoom.is_closed ? null : null
                  )
                  setClosingRoom(false)
                }}
                className={`text-xs font-semibold px-3 py-2 rounded-xl border transition-all
                  cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed
                  ${currentRoom.is_closed
                    ? 'bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20'
                    : 'bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20'
                  }`}
              >
                {closingRoom ? '…' : currentRoom.is_closed ? '✓ Open Room' : '🔒 Close Room'}
              </button>
            </div>
          </div>

          {/* Closed room overlay */}
          {currentRoom.is_closed ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="rounded-xl border border-red-500/25 bg-red-500/[0.06] p-8 text-center"
            >
              <p className="text-3xl mb-3">🔒</p>
              <p className="font-semibold text-red-400 mb-1">Room is Closed</p>
              <p className="text-kayan-muted text-sm">No new sessions can be opened in this room.</p>
              {currentRoom.closed_reason && (
                <p className="text-xs text-red-400/70 mt-2">{currentRoom.closed_reason}</p>
              )}
            </motion.div>
          ) : (
            <RoomFloorPlan
              roomId={selectedRoomId}
              seats={currentSeats}
              isAdmin={true}
              onSeatClick={onSeatClick}
            />
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-5 text-xs text-kayan-sub">
        {[
          { color: '#22C55E', label: 'Free — click to mark occupied'    },
          { color: '#EF4444', label: 'Occupied (session) — click to move' },
          { color: '#EF4444', label: 'Occupied (manual) — click to free', opacity: '0.45' },
        ].map(x => (
          <div key={x.label} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0"
                 style={{ background: x.color, opacity: x.opacity ?? 0.75 }} />
            {x.label}
          </div>
        ))}
      </div>

      <AnimatePresence>
        {changeSeatTarget && (
          <ChangeSeatModal
            occupiedSeat={changeSeatTarget}
            onClose={() => setChangeSeatTarget(null)}
          />
        )}
      </AnimatePresence>

      {openSessionSeatId && (
        <AdminOpenSession
          initialSeatId={openSessionSeatId}
          onClose={() => setOpenSessionSeatId(null)}
          onSuccess={() => { setOpenSessionSeatId(null); loadSeats() }}
        />
      )}
    </div>
  )
}