import { motion } from 'framer-motion'

// ─────────────────────────────────────────────────────────────
//  Reusable primitives
// ─────────────────────────────────────────────────────────────

/** A single bookable seat button */
function Seat({ number, occupied, isAdmin, onClick }) {
  const base =
    'w-8 h-8 rounded-lg text-[10px] font-bold flex items-center justify-center ' +
    'border transition-all duration-150 select-none flex-shrink-0'

  const style = occupied
    ? 'bg-red-500/15 border-red-500/45 text-red-400 shadow-[0_0_7px_rgba(239,68,68,0.15)]'
    : 'bg-green-500/12 border-green-500/45 text-green-400 shadow-[0_0_7px_rgba(34,197,94,0.12)]'

  const cursor = isAdmin ? 'cursor-pointer' : 'cursor-default'
  const hover  = isAdmin && !occupied
    ? 'hover:bg-green-500/28 hover:scale-110'
    : isAdmin && occupied
      ? 'hover:bg-red-500/28 hover:scale-110'
      : ''

  return (
    <motion.button
      whileTap={isAdmin ? { scale: 0.88 } : {}}
      onClick={() => isAdmin && onClick?.()}
      className={`${base} ${style} ${cursor} ${hover}`}
      title={`Seat ${number} · ${occupied ? 'Occupied' : 'Available'}`}
    >
      {number}
    </motion.button>
  )
}

/** A table surface block */
function Table({ children, className = '' }) {
  return (
    <div
      className={`rounded-lg border border-kayan-gold/22 bg-kayan-gold/[0.07] flex items-center justify-center ${className}`}
    />
  )
}

/** Gap spacer */
function Gap({ size = 8 }) {
  return <div style={{ width: size, height: size, flexShrink: 0 }} />
}

// ─────────────────────────────────────────────────────────────
//  Room layouts
// ─────────────────────────────────────────────────────────────

function Silent1({ seatMap, isAdmin, onSeat }) {
  const S = (n) => (
    <Seat
      key={n} number={n}
      occupied={seatMap[n]?.is_occupied ?? false}
      isAdmin={isAdmin}
      onClick={() => onSeat(seatMap[n])}
    />
  )

  return (
    <div className="flex flex-col gap-3 p-2">

      {/* ── Top section: top-wall table + right-wall table ── */}
      <div className="flex items-start gap-3">

        {/* Left column: door space + left-wall table */}
        <div className="flex flex-col items-center gap-1" style={{ marginTop: 0 }}>
          {/* Door label */}
          <div className="text-[8px] text-kayan-gold/50 border border-kayan-gold/20
                          bg-kayan-gold/[0.06] px-1.5 py-0.5 rounded-sm mb-1">
            باب
          </div>
          {/* Left-wall table: seats 7-11 face right */}
          <div className="flex flex-col items-end gap-1">
            {[7,8,9,10,11].map(n => (
              <div key={n} className="flex items-center gap-1">
                {S(n)}
                <div className="w-12 rounded border border-kayan-gold/22 bg-kayan-gold/[0.07]" style={{ height: 34 }} />
              </div>
            ))}
          </div>
        </div>

        {/* Center column */}
        <div className="flex flex-col gap-3 flex-1">

          {/* Top-wall table: seats 1, 2 face down */}
          <div className="flex flex-col items-start gap-1">
            <Table className="w-36 h-7" />
            <div className="flex gap-3 pl-2">
              {S(1)}{S(2)}
            </div>
          </div>

          {/* Center island table */}
          <div className="flex flex-col items-center gap-1 mt-4">
            {/* Seats above table */}
            <div className="flex gap-4 justify-center">
              {S(12)}{S(13)}{S(14)}
            </div>
            <Table className="w-52 h-14" />
            {/* Seats below table */}
            <div className="flex gap-4 justify-center">
              {S(15)}{S(16)}{S(17)}
            </div>
          </div>

        </div>

        {/* Right-wall table: seats 3-6 face left */}
        <div className="flex flex-col items-start gap-1 mt-8">
          {[3,4,5,6].map(n => (
            <div key={n} className="flex items-center gap-1">
              <div className="w-12 rounded border border-kayan-gold/22 bg-kayan-gold/[0.07]" style={{ height: 34 }} />
              {S(n)}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

function Silent2({ seatMap, isAdmin, onSeat }) {
  const S = (n) => (
    <Seat key={n} number={n}
      occupied={seatMap[n]?.is_occupied ?? false}
      isAdmin={isAdmin} onClick={() => onSeat(seatMap[n])} />
  )

  return (
    <div className="flex flex-col gap-4 p-2">

      {/* Top row: top-left small table + top-right large table */}
      <div className="flex gap-6 justify-start">

        {/* Top-left: seat 10 on top */}
        <div className="flex flex-col items-center gap-1">
          {S(10)}
          <Table className="w-14 h-9" />
        </div>

        {/* Top-right: seats 4,5 top / 2,3 bottom */}
        <div className="flex flex-col items-center gap-1 ml-8">
          <div className="flex gap-2">{S(4)}{S(5)}</div>
          <Table className="w-24 h-10" />
          <div className="flex gap-2">{S(2)}{S(3)}</div>
        </div>

      </div>

      {/* Bottom row: bottom-left large table + bottom-right small table */}
      <div className="flex gap-6 justify-start items-end mt-2">

        {/* Bottom-left: seats 8,9 top / 6,7 bottom */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-2">{S(8)}{S(9)}</div>
          <Table className="w-24 h-10" />
          <div className="flex gap-2">{S(6)}{S(7)}</div>
        </div>

        {/* Bottom-right: seat 1 on top */}
        <div className="flex flex-col items-center gap-1 ml-8">
          {S(1)}
          <Table className="w-14 h-9" />
        </div>

      </div>

      {/* Door */}
      <div className="flex justify-center mt-1">
        <div className="text-[8px] text-kayan-gold/50 border border-kayan-gold/20
                        bg-kayan-gold/[0.06] px-3 py-0.5 rounded-sm">
          باب
        </div>
      </div>

    </div>
  )
}

function Silent3({ seatMap, isAdmin, onSeat }) {
  const S = (n) => (
    <Seat key={n} number={n}
      occupied={seatMap[n]?.is_occupied ?? false}
      isAdmin={isAdmin} onClick={() => onSeat(seatMap[n])} />
  )

  return (
    <div className="flex flex-col gap-4 p-2">

      {/* Door top-left */}
      <div className="flex items-center gap-2 mb-1">
        <div className="text-[8px] text-kayan-gold/50 border border-kayan-gold/20
                        bg-kayan-gold/[0.06] px-1.5 py-0.5 rounded-sm">
          باب
        </div>
      </div>

      {/* Top table: seats 1,2,3,4 on bottom edge */}
      <div className="flex flex-col items-start gap-1 ml-4">
        <Table className="h-10" style={{ width: 260 }} />
        <div className="flex gap-4 pl-4">
          {S(1)}{S(2)}{S(3)}{S(4)}
        </div>
      </div>

      {/* Bottom table: seats 5,6,7,8,9 on top edge */}
      <div className="flex flex-col items-start gap-1 ml-4 mt-3">
        <div className="flex gap-3 pl-3">
          {S(5)}{S(6)}{S(7)}{S(8)}{S(9)}
        </div>
        <Table className="h-10" style={{ width: 310 }} />
      </div>

    </div>
  )
}

function GirlsRoom({ seatMap, isAdmin, onSeat }) {
  const S = (n) => (
    <Seat key={n} number={n}
      occupied={seatMap[n]?.is_occupied ?? false}
      isAdmin={isAdmin} onClick={() => onSeat(seatMap[n])} />
  )

  return (
    <div className="flex gap-3 p-2">

      {/* Left: door + bottom-left table */}
      <div className="flex flex-col justify-between" style={{ minHeight: 280 }}>
        {/* Door on left wall center */}
        <div className="flex-1 flex items-center">
          <div className="text-[8px] text-kayan-gold/50 border border-kayan-gold/20
                          bg-kayan-gold/[0.06] px-1 py-2 rounded-sm writing-mode-vertical">
            باب
          </div>
        </div>
        {/* Bottom-left table: seat 1 left, seat 2 right */}
        <div className="flex items-center gap-1 mt-auto">
          {S(1)}
          <Table className="w-16 h-10" />
          {S(2)}
        </div>
      </div>

      {/* Center/Right: top desks + right-wall desks */}
      <div className="flex-1 flex flex-col justify-between" style={{ minHeight: 280 }}>

        {/* Top wall: 3 standalone desks, seats 3,4,5 */}
        <div className="flex gap-6 justify-center mb-2">
          {[3,4,5].map(n => (
            <div key={n} className="flex flex-col items-center gap-1">
              <Table className="w-12 h-10" />
              {S(n)}
            </div>
          ))}
        </div>

        {/* Right wall: 3 standalone desks, seats 6,7,8 — stacked vertically */}
        <div className="flex flex-col items-end gap-4">
          {[6,7,8].map(n => (
            <div key={n} className="flex items-center gap-1">
              <Table className="w-12 h-10" />
              {S(n)}
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

function Discussion1({ seatMap, isAdmin, onSeat }) {
  const S = (n) => (
    <Seat key={n} number={n}
      occupied={seatMap[n]?.is_occupied ?? false}
      isAdmin={isAdmin} onClick={() => onSeat(seatMap[n])} />
  )

  return (
    <div className="flex flex-col gap-3 p-2">

      {/* Top section: left stack + right stack */}
      <div className="flex gap-6 justify-start">

        {/* Left side: two horizontal tables stacked */}
        <div className="flex flex-col gap-4">
          {/* Top-left table: seats 12,13 top / 10,11 bottom */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2">{S(12)}{S(13)}</div>
            <Table className="w-32 h-10" />
            <div className="flex gap-2">{S(10)}{S(11)}</div>
          </div>
          {/* Bottom-left table: seats 8,9 top / 6,7 bottom */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2">{S(8)}{S(9)}</div>
            <Table className="w-32 h-10" />
            <div className="flex gap-2">{S(6)}{S(7)}</div>
          </div>
        </div>

        {/* Right side: two tables stacked */}
        <div className="flex flex-col gap-4 ml-6">
          {/* Top-right smaller table: seat 14 top / 15 bottom */}
          <div className="flex flex-col items-center gap-1">
            {S(14)}
            <Table className="w-24 h-10" />
            {S(15)}
          </div>
          {/* Bottom-right table: seats 16,17 top / 18,19 bottom */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-2">{S(16)}{S(17)}</div>
            <Table className="w-24 h-10" />
            <div className="flex gap-2">{S(18)}{S(19)}</div>
          </div>
        </div>

      </div>

      {/* Bottom wall: long table, seats 1-5 on top edge */}
      <div className="flex flex-col gap-1 mt-3">
        <div className="flex gap-3 pl-2">
          {S(1)}{S(2)}{S(3)}{S(4)}{S(5)}
        </div>
        <Table className="h-8" style={{ width: '100%', minWidth: 280 }} />
      </div>

      {/* Door bottom-left */}
      <div className="flex justify-start mt-1">
        <div className="text-[8px] text-kayan-gold/50 border border-kayan-gold/20
                        bg-kayan-gold/[0.06] px-2 py-0.5 rounded-sm">
          باب
        </div>
      </div>

    </div>
  )
}

function Discussion2({ seatMap, isAdmin, onSeat }) {
  const S = (n) => (
    <Seat key={n} number={n}
      occupied={seatMap[n]?.is_occupied ?? false}
      isAdmin={isAdmin} onClick={() => onSeat(seatMap[n])} />
  )

  return (
    <div className="flex flex-col gap-3 p-2">

      {/* Top wall table: seats 6,7,8 facing down */}
      <div className="flex flex-col items-center gap-1">
        <Table className="w-52 h-7" />
        <div className="flex gap-4">{S(6)}{S(7)}{S(8)}</div>
      </div>

      {/* Middle section: left-wall table + right square tables */}
      <div className="flex gap-4 justify-between mt-2">

        {/* Left-wall table: seats 4,5 facing right */}
        <div className="flex items-center gap-1">
          <div className="flex flex-col gap-2 items-end">
            {S(4)}{S(5)}
          </div>
          <Table className="w-10 h-20" />
        </div>

        {/* Right center: two small square tables */}
        <div className="flex gap-3">
          {/* Left square: seat 9 top, 10 bottom */}
          <div className="flex flex-col items-center gap-1">
            {S(9)}
            <Table className="w-12 h-12" />
            {S(10)}
          </div>
          {/* Right square: seat 11 top, 12 bottom */}
          <div className="flex flex-col items-center gap-1">
            {S(11)}
            <Table className="w-12 h-12" />
            {S(12)}
          </div>
        </div>

      </div>

      {/* Bottom wall table: seats 1,2,3 facing down */}
      <div className="flex flex-col items-start gap-1 mt-2">
        <Table className="w-40 h-7" />
        <div className="flex gap-4 pl-2">{S(1)}{S(2)}{S(3)}</div>
      </div>

      {/* Door bottom-left */}
      <div className="flex justify-start mt-1">
        <div className="text-[8px] text-kayan-gold/50 border border-kayan-gold/20
                        bg-kayan-gold/[0.06] px-2 py-0.5 rounded-sm">
          باب
        </div>
      </div>

    </div>
  )
}

function Roof({ seatMap, isAdmin, onSeat }) {
  const S = (n) => (
    <Seat key={n} number={n}
      occupied={seatMap[n]?.is_occupied ?? false}
      isAdmin={isAdmin} onClick={() => onSeat(seatMap[n])} />
  )

  // Decorative scattered table
  const DecTable = ({ className = '' }) => (
    <div className={`rounded-md border border-white/[0.08] bg-white/[0.03] ${className}`} />
  )

  return (
    <div className="flex flex-col gap-2 p-2">

      {/* ── Main open terrace area (decorative tables) ── */}
      <div className="rounded-xl border border-white/[0.06] bg-white/[0.015] p-4 mb-2">
        <p className="text-[8px] text-kayan-muted tracking-widest uppercase mb-3 text-center">
          Open Terrace Area ☀️
        </p>
        <div className="flex gap-4 justify-around flex-wrap">
          <DecTable className="w-14 h-10" />
          <DecTable className="w-16 h-10" />
          <DecTable className="w-14 h-10" />
          <DecTable className="w-12 h-10" />
          <DecTable className="w-16 h-10" />
          <DecTable className="w-14 h-10" />
        </div>
      </div>

      {/* ── L-shaped seating extension (bottom-right) ── */}
      <div className="flex gap-2 justify-end">
        <div className="rounded-xl border border-kayan-border bg-kayan-gold/[0.03] p-3">
          <p className="text-[8px] text-kayan-muted tracking-wider uppercase mb-2 text-center">
            Seating Section
          </p>

          <div className="flex gap-2">

            {/* Left wall of extension: 10, 9, 8, 1 top to bottom */}
            <div className="flex flex-col gap-2 items-center border-r border-white/[0.07] pr-2">
              {S(10)}{S(9)}{S(8)}{S(1)}
            </div>

            {/* Center: bottom wall 2,3 at the bottom */}
            <div className="flex flex-col justify-end gap-2 pb-0">
              <div style={{ flex: 1 }} />
              <div className="flex flex-col gap-2 items-center border-t border-white/[0.07] pt-2">
                {S(2)}{S(3)}
              </div>
            </div>

            {/* Right wall: 7, 6, 5, 4 top to bottom */}
            <div className="flex flex-col gap-2 items-center border-l border-white/[0.07] pl-2">
              {S(7)}{S(6)}{S(5)}{S(4)}
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main export — routes to correct room layout
// ─────────────────────────────────────────────────────────────
export default function RoomFloorPlan({ roomId, seats = [], isAdmin = false, onSeatClick }) {
  // Build seat lookup: seat_number → seat object
  const seatMap = {}
  seats.forEach(s => { seatMap[s.seat_number] = s })

  const handleSeat = (seat) => {
    if (seat && isAdmin) onSeatClick?.(seat)
  }

  const props = { seatMap, isAdmin, onSeat: handleSeat }

  const ROOMS = {
    1: <Silent1     {...props} />,
    2: <Silent2     {...props} />,
    3: <Silent3     {...props} />,
    4: <GirlsRoom   {...props} />,
    5: <Discussion1 {...props} />,
    6: <Roof        {...props} />,
    7: <Discussion2 {...props} />,
  }

  const room = ROOMS[roomId]

  if (!room) {
    // Fallback plain grid
    return (
      <div className="flex flex-wrap gap-2 p-2">
        {seats.sort((a,b)=>a.seat_number-b.seat_number).map(s => (
          <Seat key={s.id} number={s.seat_number}
            occupied={s.is_occupied} isAdmin={isAdmin}
            onClick={() => isAdmin && onSeatClick?.(s)} />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: 300 }}>
        {room}
      </div>
    </div>
  )
}