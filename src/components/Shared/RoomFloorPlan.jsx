import { motion } from 'framer-motion'

// ─────────────────────────────────────────────────────────────
//  Primitives
// ─────────────────────────────────────────────────────────────

const SEAT_BASE =
  'w-8 h-8 rounded-lg text-[10px] font-bold flex items-center justify-center ' +
  'border select-none flex-shrink-0 transition-all duration-150'

function SeatBtn({ n, seat, isAdmin, onSeat }) {
  if (!seat)
    return <div className="w-8 h-8 flex-shrink-0 border border-transparent opacity-0" />

  const occ = seat.is_occupied
  return (
    <motion.button
      whileTap={isAdmin ? { scale: 0.88 } : {}}
      onClick={() => isAdmin && onSeat?.(seat)}
      title={`Seat ${n} · ${occ ? 'Occupied' : 'Free'}`}
      className={[
        SEAT_BASE,
        occ
          ? 'bg-red-500/15 border-red-500/45 text-red-400'
          : 'bg-green-500/12 border-green-500/45 text-green-400',
        isAdmin ? 'cursor-pointer hover:scale-110' : 'cursor-default',
      ].join(' ')}
    >
      {n}
    </motion.button>
  )
}

// Table surface
const Tbl = ({ className = '', style }) => (
  <div
    className={`rounded-lg border border-kayan-gold/22 bg-kayan-gold/[0.07] flex-shrink-0 ${className}`}
    style={style}
  />
)

// Door badge
const Door = () => (
  <span className="text-[8px] text-kayan-gold/55 border border-kayan-gold/20 bg-kayan-gold/[0.06] px-2 py-0.5 rounded select-none flex-shrink-0">
    باب
  </span>
)

// ─────────────────────────────────────────────────────────────
//  Room 1 — Silent 1  (17 seats)
//
//  [باب] [====top table====]
//         seat1  seat2
//
//  [tbl] seat7        seat3 [tbl]
//  [lft] seat8        seat4 [rgt]
//  [wal] seat9        seat5 [wal]
//  [ l ] seat10       seat6 [ r ]
//  [ ] seat11
//            seat12 seat13 seat14
//            [====center table====]
//            seat15 seat16 seat17
// ─────────────────────────────────────────────────────────────
function Silent1({ seatMap, isAdmin, onSeat }) {
  const s = n => <SeatBtn key={n} n={n} seat={seatMap[n]} isAdmin={isAdmin} onSeat={onSeat} />

  return (
    <div className="p-4 flex flex-col gap-2">

      {/* Top row: door + horizontal top-wall table → seats 1,2 below */}
      <div className="flex items-end gap-3 mb-1">
        <Door />
        <div className="flex flex-col items-start gap-1">
          <Tbl className="w-40 h-7" />
          <div className="flex gap-3 pl-1">{s(1)}{s(2)}</div>
        </div>
      </div>

      {/* Main body */}
      <div className="flex gap-3 items-center">

        {/* Left wall: vertical table — seats 7-11 face right (east) */}
        <div className="flex items-center gap-2">
          <Tbl className="w-7 h-44" />
          <div className="flex flex-col gap-2">{[7,8,9,10,11].map(s)}</div>
        </div>

        {/* Center island table */}
        <div className="flex-1 flex flex-col items-center gap-2">
          <div className="flex gap-4">{s(12)}{s(13)}{s(14)}</div>
          <Tbl className="w-56 h-14" />
          <div className="flex gap-4">{s(15)}{s(16)}{s(17)}</div>
        </div>

        {/* Right wall: seats 3-6 face left (west) ← vertical table */}
        <div className="flex items-center gap-2">
          <div className="flex flex-col gap-2">{[3,4,5,6].map(s)}</div>
          <Tbl className="w-7 h-36" />
        </div>

      </div>
    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Room 2 — Silent 2  (10 seats)
//
//  seat10          seat4 seat5
//  [sm-tbl]        [=big-tbl=]
//                  seat2 seat3
//
//  seat8 seat9              seat1
//  [=big-tbl=]              [sm-tbl]
//  seat6 seat7
//
//            [ باب ]
// ─────────────────────────────────────────────────────────────
function Silent2({ seatMap, isAdmin, onSeat }) {
  const s = n => <SeatBtn key={n} n={n} seat={seatMap[n]} isAdmin={isAdmin} onSeat={onSeat} />

  return (
    <div className="p-4 flex flex-col gap-6">

      {/* Top row */}
      <div className="flex gap-10 items-start">
        {/* Top-left: seat 10 above small table */}
        <div className="flex flex-col items-center gap-1">
          {s(10)}
          <Tbl className="w-16 h-10" />
        </div>
        {/* Top-right: big table, 4,5 top / 2,3 bottom */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-2">{s(4)}{s(5)}</div>
          <Tbl className="w-28 h-12" />
          <div className="flex gap-2">{s(2)}{s(3)}</div>
        </div>
      </div>

      {/* Bottom row */}
      <div className="flex gap-10 items-start">
        {/* Bottom-left: big table, 8,9 top / 6,7 bottom */}
        <div className="flex flex-col items-center gap-1">
          <div className="flex gap-2">{s(8)}{s(9)}</div>
          <Tbl className="w-28 h-12" />
          <div className="flex gap-2">{s(6)}{s(7)}</div>
        </div>
        {/* Bottom-right: seat 1 above small table */}
        <div className="flex flex-col items-center gap-1">
          {s(1)}
          <Tbl className="w-16 h-10" />
        </div>
      </div>

      {/* Door — bottom center */}
      <div className="flex justify-center"><Door /></div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Room 3 — Silent 3  (9 seats)
//
//  [باب]
//  [=======top table=======]
//  seat1  seat2  seat3  seat4
//
//  seat5  seat6  seat7  seat8  seat9
//  [=========bottom table=========]
// ─────────────────────────────────────────────────────────────
function Silent3({ seatMap, isAdmin, onSeat }) {
  const s = n => <SeatBtn key={n} n={n} seat={seatMap[n]} isAdmin={isAdmin} onSeat={onSeat} />

  return (
    <div className="p-4 flex flex-col gap-5">

      <div><Door /></div>

      {/* Top table — seats 1,2,3,4 on bottom edge */}
      <div className="flex flex-col items-start gap-1">
        <Tbl className="w-72 h-9" />
        <div className="flex gap-4 pl-3">{s(1)}{s(2)}{s(3)}{s(4)}</div>
      </div>

      <div className="h-2" />

      {/* Bottom table — seats 5,6,7,8,9 on top edge */}
      <div className="flex flex-col items-start gap-1">
        <div className="flex gap-3 pl-1">{s(5)}{s(6)}{s(7)}{s(8)}{s(9)}</div>
        <Tbl className="w-80 h-9" />
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Room 4 — Girls Room  (8 seats)
//
//       [desk3] [desk4] [desk5]      [desk6]
//                                    seat6
//  [باب]                             [desk7]
//                                    seat7
//  seat1 [===table===] seat2         [desk8]
//                                    seat8
// ─────────────────────────────────────────────────────────────
function GirlsRoom({ seatMap, isAdmin, onSeat }) {
  const s = n => <SeatBtn key={n} n={n} seat={seatMap[n]} isAdmin={isAdmin} onSeat={onSeat} />

  return (
    <div className="p-4">

      {/* Top wall — 3 individual desks, seats below each */}
      <div className="flex gap-6 justify-around mb-5 ml-6">
        {[3,4,5].map(n => (
          <div key={n} className="flex flex-col items-center gap-1">
            <Tbl className="w-14 h-10" />
            {s(n)}
          </div>
        ))}
      </div>

      {/* Middle — door on left, right-wall desks on right */}
      <div className="flex items-center justify-between">
        <Door />
        {/* Right wall: 3 desks, seat to the left of each */}
        <div className="flex flex-col gap-3">
          {[6,7,8].map(n => (
            <div key={n} className="flex items-center gap-1">
              {s(n)}
              <Tbl className="w-14 h-10" />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom-left — table with seat 1 on left, seat 2 on right */}
      <div className="flex items-center gap-1 mt-5">
        {s(1)}
        <Tbl className="w-24 h-10" />
        {s(2)}
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Room 5 — Discussion 1  (19 seats)
//
//  seat12 seat13      seat14
//  [=left-top-tbl=]   [sm-tbl]
//  seat10 seat11      seat15
//
//  seat8  seat9       seat16 seat17
//  [=left-bot-tbl=]   [=right-bot-tbl=]
//  seat6  seat7       seat18 seat19
//
//  seat1 seat2 seat3 seat4 seat5
//  [=========long bottom table=========]
//  [باب]
// ─────────────────────────────────────────────────────────────
function Discussion1({ seatMap, isAdmin, onSeat }) {
  const s = n => <SeatBtn key={n} n={n} seat={seatMap[n]} isAdmin={isAdmin} onSeat={onSeat} />

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Upper clusters */}
      <div className="flex gap-8">

        {/* LEFT: 2 stacked tables */}
        <div className="flex flex-col gap-5">
          {/* Top-left table: 12,13 top / 10,11 bottom */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-3">{s(12)}{s(13)}</div>
            <Tbl className="w-36 h-10" />
            <div className="flex gap-3">{s(10)}{s(11)}</div>
          </div>
          {/* Bottom-left table: 8,9 top / 6,7 bottom */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-3">{s(8)}{s(9)}</div>
            <Tbl className="w-36 h-10" />
            <div className="flex gap-3">{s(6)}{s(7)}</div>
          </div>
        </div>

        {/* RIGHT: 2 stacked tables */}
        <div className="flex flex-col gap-5">
          {/* Top-right small table: 14 top / 15 bottom */}
          <div className="flex flex-col items-center gap-1">
            {s(14)}
            <Tbl className="w-24 h-10" />
            {s(15)}
          </div>
          {/* Bottom-right table: 16,17 top / 18,19 bottom */}
          <div className="flex flex-col items-center gap-1">
            <div className="flex gap-3">{s(16)}{s(17)}</div>
            <Tbl className="w-28 h-10" />
            <div className="flex gap-3">{s(18)}{s(19)}</div>
          </div>
        </div>

      </div>

      {/* Bottom wall: seats 1-5 ABOVE long table */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-2 pl-1">{s(1)}{s(2)}{s(3)}{s(4)}{s(5)}</div>
        <Tbl style={{ width: '100%', minWidth: 280, height: 32 }} />
      </div>

      <div><Door /></div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Room 7 — Discussion 2  (12 seats)
//
//  [========top wall table========]
//       seat6   seat7   seat8
//
//  [lw]  seat4        seat9   seat11
//  [tb]  seat5        [sq-L]  [sq-R]
//                     seat10  seat12
//
//  seat1  seat2  seat3
//  [===bottom wall table===]
//  [باب]
// ─────────────────────────────────────────────────────────────
function Discussion2({ seatMap, isAdmin, onSeat }) {
  const s = n => <SeatBtn key={n} n={n} seat={seatMap[n]} isAdmin={isAdmin} onSeat={onSeat} />

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Top wall table — seats 6,7,8 below */}
      <div className="flex flex-col items-center gap-1">
        <Tbl className="w-56 h-7" />
        <div className="flex gap-5">{s(6)}{s(7)}{s(8)}</div>
      </div>

      {/* Middle — left-wall table + two square tables */}
      <div className="flex items-center justify-between gap-4 px-1">
        {/* Left wall: vertical table — seats 4,5 face right */}
        <div className="flex items-center gap-2">
          <Tbl className="w-9 h-20" />
          <div className="flex flex-col gap-2">{s(4)}{s(5)}</div>
        </div>
        {/* Two small square tables: seat 9/10 and 11/12 */}
        <div className="flex gap-4">
          <div className="flex flex-col items-center gap-1">
            {s(9)}<Tbl className="w-14 h-14" />{s(10)}
          </div>
          <div className="flex flex-col items-center gap-1">
            {s(11)}<Tbl className="w-14 h-14" />{s(12)}
          </div>
        </div>
      </div>

      {/* Bottom wall — seats 1,2,3 ABOVE table */}
      <div className="flex flex-col gap-1">
        <div className="flex gap-5 pl-1">{s(1)}{s(2)}{s(3)}</div>
        <Tbl className="w-44 h-7" />
      </div>

      <div><Door /></div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Room 6 — Roof  (10 seats)
//
//  [ Open terrace — decorative scattered tables ]
//  [                                             ]
//
//                  [ L-shaped seating section  ]
//             10   [              ]   7
//              9   [              ]   6
//              8   [              ]   5
//              1   [              ]   4
//                       2    3
// ─────────────────────────────────────────────────────────────
function Roof({ seatMap, isAdmin, onSeat }) {
  const s = n => <SeatBtn key={n} n={n} seat={seatMap[n]} isAdmin={isAdmin} onSeat={onSeat} />
  const DecTbl = ({ w = 44 }) => (
    <div
      className="h-8 rounded-md border border-white/[0.07] bg-white/[0.025] flex-shrink-0"
      style={{ width: w }}
    />
  )

  return (
    <div className="p-4 flex flex-col gap-4">

      {/* Decorative terrace area */}
      <div className="rounded-xl border border-white/[0.07] bg-white/[0.012] p-4">
        <p className="text-[8px] text-kayan-muted tracking-widest uppercase text-center mb-3">
          Open Terrace ☀️
        </p>
        <div className="flex flex-wrap gap-3 justify-center">
          <DecTbl w={48}/><DecTbl w={64}/><DecTbl w={40}/>
          <DecTbl w={36}/><DecTbl w={56}/><DecTbl w={44}/><DecTbl w={40}/>
        </div>
      </div>

      {/* L-shaped seating section */}
      <div className="flex justify-end">
        <div className="border border-kayan-border rounded-xl bg-kayan-gold/[0.03] p-3">
          <p className="text-[8px] text-kayan-muted tracking-wider uppercase text-center mb-2">
            Seating Section
          </p>

          <div className="flex gap-1">

            {/* Left wall: 10 → 9 → 8 → 1 (top to bottom) */}
            <div className="flex flex-col gap-2 border-r border-white/[0.08] pr-2">
              {s(10)}{s(9)}{s(8)}{s(1)}
            </div>

            {/* Center floor + bottom wall seats 2,3 */}
            <div className="flex flex-col justify-between px-2" style={{ minHeight: 196 }}>
              <div className="flex-1 rounded-lg border border-white/[0.05] bg-white/[0.02]"
                   style={{ minWidth: 56, minHeight: 120 }} />
              <div className="flex gap-2 justify-center mt-2">{s(2)}{s(3)}</div>
            </div>

            {/* Right wall: 7 → 6 → 5 → 4 (top to bottom) */}
            <div className="flex flex-col gap-2 border-l border-white/[0.08] pl-2">
              {s(7)}{s(6)}{s(5)}{s(4)}
            </div>

          </div>
        </div>
      </div>

    </div>
  )
}

// ─────────────────────────────────────────────────────────────
//  Main export
// ─────────────────────────────────────────────────────────────
export default function RoomFloorPlan({ roomId, seats = [], isAdmin = false, onSeatClick }) {
  // Build lookup: seat_number → seat object
  const seatMap = {}
  seats.forEach(s => { seatMap[s.seat_number] = s })

  const props = { seatMap, isAdmin, onSeat: (seat) => seat && isAdmin && onSeatClick?.(seat) }

  const LAYOUTS = {
    1: <Silent1     {...props} />,
    2: <Silent2     {...props} />,
    3: <Silent3     {...props} />,
    4: <GirlsRoom   {...props} />,
    5: <Discussion1 {...props} />,
    6: <Roof        {...props} />,
    7: <Discussion2 {...props} />,
  }

  const layout = LAYOUTS[roomId]

  if (!layout) {
    // Plain grid fallback for unknown rooms
    return (
      <div className="flex flex-wrap gap-2 p-2">
        {[...seats].sort((a,b) => a.seat_number - b.seat_number).map(seat => (
          <SeatBtn
            key={seat.id}
            n={seat.seat_number}
            seat={seat}
            isAdmin={isAdmin}
            onSeat={() => isAdmin && onSeatClick?.(seat)}
          />
        ))}
      </div>
    )
  }

  return (
    <div className="w-full overflow-x-auto">
      <div style={{ minWidth: 300 }}>
        {layout}
      </div>
    </div>
  )
}