import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'

/**
 * ChangeSeatModal
 * Opens when admin clicks an occupied (red) seat.
 * Shows who's sitting there and lets admin pick any free seat
 * in any room to move them to.
 *
 * @param {Object}   occupiedSeat  — the red seat that was clicked
 * @param {Function} onClose
 */
export default function ChangeSeatModal({ occupiedSeat, onClose }) {
  const { getSessionBySeat, handleMoveSeat, loadSeats } = useKayan()
  const rooms = useKayanStore(s => s.rooms)
  const seats = useKayanStore(s => s.seats)

  const [session, setSession] = useState(null)   // who's in the seat
  const [loading, setLoading] = useState(true)
  const [targetRoom, setTargetRoom] = useState(null)   // room admin browsed to
  const [newSeatId, setNewSeatId] = useState(null)   // seat admin picked
  const [moving, setMoving] = useState(false)

  // Resolve who's sitting in the clicked seat
  useEffect(() => {
    getSessionBySeat(occupiedSeat.id).then(s => {
      console.log('[Kayan] ChangeSeat — session for seat', occupiedSeat.id, ':', s)
      setSession(s)
      setLoading(false)
    })
    // Default target room to current room
    setTargetRoom(occupiedSeat.room_id)
  }, [occupiedSeat.id]) // eslint-disable-line

  const currentRoom = rooms.find(r => r.id === targetRoom)
  const roomSeats = (seats[targetRoom] ?? [])
  const freeSeatCount = roomSeats.filter(s => !s.is_occupied).length

  const confirm = async () => {
    if (!newSeatId || !session?.id) return
    setMoving(true)
    try {
      await handleMoveSeat(session.id, newSeatId)
      onClose()
    } catch {
      // error already toasted
    } finally {
      setMoving(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[8000] flex items-end sm:items-center justify-center p-0 sm:p-5"
        style={{ background: 'rgba(7,7,14,0.9)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
          className="glass border border-kayan-border rounded-t-3xl sm:rounded-3xl
                     w-full sm:max-w-lg p-7"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div>
              <p className="text-[8px] tracking-[3px] text-kayan-muted uppercase mb-1">
                Admin · Seat Map
              </p>
              <h2 className="font-display text-2xl font-bold">Change Seat</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.09]
                         flex items-center justify-center text-kayan-sub text-sm
                         transition-colors cursor-pointer border-none flex-shrink-0"
            >
              ✕
            </button>
          </div>

          {/* Current customer info */}
          <div className="rounded-xl p-4 mb-6 bg-red-500/[0.06] border border-red-500/20">
            <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-2">
              Currently In This Seat
            </p>
            {loading ? (
              <div className="h-5 w-40 rounded bg-white/[0.04] animate-pulse" />
            ) : session ? (
              <div className="flex items-center gap-3">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
                                text-sm font-bold text-kayan-gold bg-kayan-gold/10 border border-kayan-border">
                  {(session.customer?.full_name ?? 'G')[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-semibold">{session.customer?.full_name}</p>
                  <div className="flex items-center gap-2">
                    {session.customer?.username && (
                      <span className="text-[9px] text-kayan-muted font-mono">
                        {session.customer.username}
                      </span>
                    )}
                    <span className="text-[9px] text-kayan-muted">
                      · {occupiedSeat.room_name ?? `Room ${occupiedSeat.room_id}`}
                      , Seat #{occupiedSeat.seat_number}
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-kayan-muted text-sm">
                No active session found for this seat.
              </p>
            )}
          </div>

          {/* Room selector */}
          <div className="mb-4">
            <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-3">
              Move To — Select Room
            </p>
            <div className="flex flex-wrap gap-2">
              {rooms.map(r => {
                const free = (seats[r.id] ?? []).filter(s => !s.is_occupied).length
                return (
                  <button
                    key={r.id}
                    onClick={() => { setTargetRoom(r.id); setNewSeatId(null) }}
                    className={`kayan-tab ${targetRoom === r.id ? 'active' : ''} relative`}
                  >
                    {r.name}
                    <span className={`ml-1.5 text-[9px] font-semibold
                      ${free > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {free} free
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Seat picker for selected room */}
          {currentRoom && (
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <p className="text-[9px] text-kayan-muted tracking-wider uppercase">
                  {currentRoom.name} · {currentRoom.name_ar} · {freeSeatCount} available
                </p>
                <div className="flex gap-3 text-[9px] text-kayan-muted">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-green-400/70" />Free
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-kayan-gold/70" />Selected
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-sm bg-red-400/70" />Taken
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {roomSeats.map(seat => {
                  const isSelected = newSeatId === seat.id
                  const isCurrent = seat.id === occupiedSeat.id
                  const isOccupied = seat.is_occupied && !isCurrent

                  let cls = ''
                  if (isSelected) cls = 'bg-kayan-gold/25 border-kayan-gold/70 text-kayan-gold scale-110 cursor-pointer'
                  else if (isCurrent) cls = 'bg-orange-500/15 border-orange-500/40 text-orange-400 cursor-not-allowed'
                  else if (isOccupied) cls = 'bg-red-500/10 border-red-500/30 text-red-400 cursor-not-allowed opacity-60'
                  else cls = 'bg-green-500/10 border-green-500/40 text-green-400 cursor-pointer hover:bg-green-500/25 hover:scale-110'

                  return (
                    <button
                      key={seat.id}
                      disabled={isOccupied || isCurrent}
                      onClick={() => !isOccupied && !isCurrent && setNewSeatId(seat.id)}
                      title={isCurrent ? 'Current seat' : isOccupied ? 'Occupied' : `Seat ${seat.seat_number}`}
                      className={`w-9 h-9 rounded-lg text-[10px] font-semibold
                                  flex items-center justify-center flex-shrink-0
                                  transition-all duration-150 border ${cls}`}
                    >
                      {isCurrent ? '●' : seat.seat_number}
                    </button>
                  )
                })}
              </div>

              {newSeatId && (
                <motion.p
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-xs text-kayan-gold mt-3 flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-kayan-gold inline-block" />
                  Moving to {currentRoom.name}, Seat #{roomSeats.find(s => s.id === newSeatId)?.seat_number}
                </motion.p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-4 border-t border-white/[0.05]">
            <button onClick={onClose} className="btn-ghost flex-1" disabled={moving}>
              Cancel
            </button>
            <button
              onClick={confirm}
              disabled={!newSeatId || !session?.id || moving}
              className="btn-gold flex-[2] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {moving ? 'Moving…' : `Confirm Move →`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}