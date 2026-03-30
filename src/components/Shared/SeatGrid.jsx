/**
 * SeatGrid
 * @param {Object[]} seats        — array of seat objects for one room
 * @param {boolean}  isAdmin      — if true, seats are clickable for toggle
 * @param {Function} onToggle     — (seat) => void  (admin only)
 */
export default function SeatGrid({ seats = [], isAdmin = false, onToggle }) {
  return (
    <div className="flex flex-wrap gap-2">
      {seats.map(seat => (
        <button
          key={seat.id}
          title={`Seat ${seat.seat_number} · ${seat.is_occupied ? 'Occupied' : 'Available'}`}
          onClick={() => isAdmin && onToggle?.(seat)}
          className={
            seat.is_occupied
              ? `seat-occupied ${!isAdmin ? 'seat-readonly' : ''}`
              : `seat-free ${!isAdmin ? 'seat-readonly' : ''}`
          }
        >
          {seat.seat_number}
        </button>
      ))}
    </div>
  )
}
