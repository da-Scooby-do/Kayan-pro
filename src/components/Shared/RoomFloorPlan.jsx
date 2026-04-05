import { motion } from 'framer-motion'

// ─────────────────────────────────────────────────────────────
//  Room Layout Definitions
//  Each seat array index = seat_number - 1
//  Positions are [x, y] in pixels within the room container
//  Furniture: { type, x, y, w, h, label? }
//    types: 'table' | 'counter' | 'screen' | 'wall-bar'
// ─────────────────────────────────────────────────────────────

const ROOM_LAYOUTS = {

  // ══════════════════════════════════════════════════════
  //  SILENT 1  (Room 1 — 12 seats)
  //  - Door top-left
  //  - Top counter bar → seats 1, 2
  //  - Right wall bar  → seats 3, 4, 5, 6
  //  - Left wall bar   → seats 7, 8, 9, 10
  //  - Center table    → seats 11, 12
  // ══════════════════════════════════════════════════════
  1: {
    w: 500, h: 380,
    door: { x: 10, y: 10, label: 'باب', side: 'top-left' },
    furniture: [
      { type: 'counter',  x: 55, y: 18, w: 230, h: 26,  label: 'Counter' },
      { type: 'wall-bar', x: 16, y: 72, w: 26,  h: 230 },
      { type: 'wall-bar', x: 420, y: 56, w: 26, h: 240 },
      { type: 'table',   x: 148, y: 210, w: 200, h: 120, label: 'Table' },
    ],
    seats: [
      [108, 62],   // 1
      [190, 62],   // 2
      [392, 75],   // 3
      [392, 130],  // 4
      [392, 185],  // 5
      [392, 240],  // 6
      [62,  90],   // 7
      [62,  145],  // 8
      [62,  200],  // 9
      [62,  255],  // 10
      [218, 180],  // 11 — above table
      [218, 348],  // 12 — below table
    ],
  },

  // ══════════════════════════════════════════════════════
  //  SILENT 2  (Room 2 — 15 seats)
  //  - Door bottom-left
  //  - Left big table  → seats 6-10
  //  - Right table     → seats 2-5, 11, 12
  //  - Extra singles   → 13, 14, 15
  //  - Seat 1 (single corner)
  // ══════════════════════════════════════════════════════
  2: {
    w: 520, h: 420,
    door: { x: 10, y: 380, label: 'باب', side: 'bottom-left' },
    furniture: [
      { type: 'table', x: 30,  y: 80,  w: 195, h: 240, label: 'Table L' },
      { type: 'table', x: 290, y: 80,  w: 175, h: 195, label: 'Table R' },
    ],
    seats: [
      [462, 360],  // 1 — corner single
      [325, 305],  // 2 — right table bottom-L
      [425, 305],  // 3 — right table bottom-R
      [325, 62],   // 4 — right table top-L
      [425, 62],   // 5 — right table top-R
      [65,  345],  // 6 — left table bottom-L
      [165, 345],  // 7 — left table bottom-R
      [65,  62],   // 8 — left table top-L
      [165, 62],   // 9 — left table top-R
      [12,  195],  // 10 — left table left-mid
      [243, 130],  // 11 — left table right-top
      [243, 195],  // 12 — left table right-mid
      [243, 260],  // 13 — left table right-bot
      [479, 130],  // 14 — right table right-top
      [479, 235],  // 15 — right table right-bot
    ],
  },

  // ══════════════════════════════════════════════════════
  //  SILENT 3  (Room 3 — 12 seats)
  //  - Door left side
  //  - One long double-row table running across
  //  - Front row: seats 1-5 (facing the table)
  //  - Back row:  seats 6-12 (behind)
  // ══════════════════════════════════════════════════════
  3: {
    w: 520, h: 280,
    door: { x: 10, y: 120, label: 'باب', side: 'left' },
    furniture: [
      { type: 'table', x: 55, y: 88, w: 410, h: 100, label: 'Long Table' },
    ],
    seats: [
      [95,  62],   // 1 — front row
      [170, 62],   // 2
      [245, 62],   // 3
      [320, 62],   // 4
      [395, 62],   // 5
      [85,  208],  // 6 — back row
      [148, 208],  // 7
      [211, 208],  // 8
      [274, 208],  // 9
      [337, 208],  // 10
      [400, 208],  // 11
      [463, 208],  // 12
    ],
  },

  // ══════════════════════════════════════════════════════
  //  GIRLS ROOM  (Room 4 — 18 seats)
  //  Individual desks/computers in rows
  //  3 columns × 5 rows + 3 extra at back counter
  // ══════════════════════════════════════════════════════
  4: {
    w: 480, h: 460,
    door: { x: 10, y: 20, label: 'باب', side: 'top-left' },
    furniture: [
      { type: 'desk', x: 48,  y: 60,  w: 60, h: 45 },
      { type: 'desk', x: 208, y: 60,  w: 60, h: 45 },
      { type: 'desk', x: 368, y: 60,  w: 60, h: 45 },
      { type: 'desk', x: 48,  y: 150, w: 60, h: 45 },
      { type: 'desk', x: 208, y: 150, w: 60, h: 45 },
      { type: 'desk', x: 368, y: 150, w: 60, h: 45 },
      { type: 'desk', x: 48,  y: 240, w: 60, h: 45 },
      { type: 'desk', x: 208, y: 240, w: 60, h: 45 },
      { type: 'desk', x: 368, y: 240, w: 60, h: 45 },
      { type: 'desk', x: 48,  y: 330, w: 60, h: 45 },
      { type: 'desk', x: 208, y: 330, w: 60, h: 45 },
      { type: 'desk', x: 368, y: 330, w: 60, h: 45 },
      { type: 'counter', x: 30, y: 410, w: 420, h: 28 },
    ],
    seats: [
      [78,  118],  // 1
      [238, 118],  // 2
      [398, 118],  // 3
      [78,  208],  // 4
      [238, 208],  // 5
      [398, 208],  // 6
      [78,  298],  // 7
      [238, 298],  // 8
      [398, 298],  // 9
      [78,  388],  // 10
      [238, 388],  // 11
      [398, 388],  // 12
      [95,  452],  // 13 — front counter
      [210, 452],  // 14
      [325, 452],  // 15
      [428, 160],  // 16 — right side
      [428, 248],  // 17
      [428, 336],  // 18
    ],
  },

  // ══════════════════════════════════════════════════════
  //  DISCUSSION 1  (Room 5 — 15 seats)
  //  - Multiple table clusters
  //  - Left cluster: big table, seats around it
  //  - Right cluster: second table
  //  - Bottom bar: 3 seats
  //  - Door bottom-left
  // ══════════════════════════════════════════════════════
  5: {
    w: 560, h: 460,
    door: { x: 10, y: 420, label: 'باب', side: 'bottom-left' },
    furniture: [
      { type: 'table', x: 40,  y: 60,  w: 220, h: 260, label: 'Table 1' },
      { type: 'table', x: 320, y: 60,  w: 180, h: 200, label: 'Table 2' },
      { type: 'counter', x: 40, y: 390, w: 480, h: 28 },
    ],
    seats: [
      [95,  422],  // 1  — bottom bar
      [195, 422],  // 2
      [295, 422],  // 3
      [88,  340],  // 4  — left table bottom-L
      [210, 340],  // 5  — left table bottom-R
      [88,  42],   // 6  — left table top-L
      [155, 42],   // 7  — left table top-M
      [222, 42],   // 8  — left table top-R
      [22,  130],  // 9  — left table left-top
      [22,  195],  // 10 — left table left-mid
      [22,  260],  // 11 — left table left-bot
      [278, 160],  // 12 — left table right-top
      [278, 260],  // 13 — left table right-bot
      [360, 42],   // 14 — right table top-L
      [450, 42],   // 15 — right table top-R
    ],
  },

  // ══════════════════════════════════════════════════════
  //  DISCUSSION 2  (Room 7 — 12 seats)
  //  - Top bar with 3 seats
  //  - Left: screen/whiteboard + seats
  //  - Right: individual monitor seats
  //  - Bottom counter: 3 seats
  // ══════════════════════════════════════════════════════
  7: {
    w: 500, h: 420,
    door: { x: 10, y: 380, label: 'باب', side: 'bottom-left' },
    furniture: [
      { type: 'screen',  x: 30,  y: 18,  w: 440, h: 30, label: '— Whiteboard —' },
      { type: 'table',   x: 30,  y: 90,  w: 200, h: 160, label: 'Table' },
      { type: 'desk',    x: 310, y: 90,  w: 65,  h: 55 },
      { type: 'desk',    x: 400, y: 90,  w: 65,  h: 55 },
      { type: 'desk',    x: 310, y: 190, w: 65,  h: 55 },
      { type: 'desk',    x: 400, y: 190, w: 65,  h: 55 },
      { type: 'counter', x: 30,  y: 330, w: 440, h: 28 },
    ],
    seats: [
      [110, 362],  // 1  — bottom counter
      [225, 362],  // 2
      [340, 362],  // 3
      [75,  70],   // 4  — above table top-L
      [175, 70],   // 5  — above table top-R
      [15,  140],  // 6  — left of table top
      [15,  215],  // 7  — left of table bot
      [248, 140],  // 8  — right of table top
      [248, 215],  // 9  — right of table bot
      [342, 162],  // 10 — desk row right-top
      [432, 162],  // 11
      [342, 262],  // 12 — desk row right-bot
    ],
  },

  // ══════════════════════════════════════════════════════
  //  ROOF  (Room 6 — 18 seats)
  //  - Open terrace area, scattered tables
  //  - Seating section bottom-right
  //  - Some scattered individual tables top area
  // ══════════════════════════════════════════════════════
  6: {
    w: 600, h: 480,
    door: { x: 10, y: 440, label: 'باب', side: 'bottom-left' },
    furniture: [
      // Scattered terrace tables (decorative)
      { type: 'table', x: 30,  y: 30,  w: 80, h: 60,  label: '' },
      { type: 'table', x: 200, y: 20,  w: 90, h: 65,  label: '' },
      { type: 'table', x: 390, y: 30,  w: 75, h: 60,  label: '' },
      { type: 'table', x: 100, y: 160, w: 85, h: 65,  label: '' },
      { type: 'table', x: 280, y: 170, w: 90, h: 65,  label: '' },
      // Main seating section bottom-right
      { type: 'table', x: 350, y: 290, w: 220, h: 160, label: 'Seating Area' },
    ],
    seats: [
      // Bottom-right seating area — seats 1-10
      [365, 462],  // 1
      [415, 462],  // 2
      [465, 462],  // 3
      [515, 462],  // 4
      [565, 462],  // 5
      [330, 380],  // 6
      [330, 340],  // 7
      [330, 300],  // 8
      [575, 380],  // 9
      [575, 340],  // 10
      // Scattered terrace seats
      [50,  108],  // 11
      [105, 108],  // 12
      [220, 100],  // 13
      [270, 100],  // 14
      [408, 105],  // 15
      [458, 105],  // 16
      [120, 240],  // 17
      [300, 250],  // 18
    ],
  },
}

// ─────────────────────────────────────────────────────────────
//  Furniture color map
// ─────────────────────────────────────────────────────────────
const FURNITURE_STYLE = {
  'table':    { bg: 'rgba(201,168,76,0.08)',  border: 'rgba(201,168,76,0.25)' },
  'counter':  { bg: 'rgba(255,255,255,0.06)', border: 'rgba(255,255,255,0.15)' },
  'wall-bar': { bg: 'rgba(255,255,255,0.07)', border: 'rgba(255,255,255,0.18)' },
  'desk':     { bg: 'rgba(129,140,248,0.10)', border: 'rgba(129,140,248,0.28)' },
  'screen':   { bg: 'rgba(34,197,94,0.08)',   border: 'rgba(34,197,94,0.3)'   },
}

// ─────────────────────────────────────────────────────────────
//  RoomFloorPlan component
// ─────────────────────────────────────────────────────────────
export default function RoomFloorPlan({ roomId, seats = [], isAdmin = false, onSeatClick }) {
  const layout = ROOM_LAYOUTS[roomId]

  // Fallback: unknown room → plain grid
  if (!layout) {
    return (
      <div className="flex flex-wrap gap-2">
        {seats.map(s => (
          <button key={s.id}
            onClick={() => isAdmin && onSeatClick?.(s)}
            className={`seat-btn ${s.is_occupied ? 'seat-occupied' : 'seat-free'} ${!isAdmin ? 'seat-readonly' : ''}`}>
            {s.seat_number}
          </button>
        ))}
      </div>
    )
  }

  const { w, h, furniture, seats: positions, door } = layout

  // Map: seat_number → seat object (from DB)
  const seatByNumber = {}
  seats.forEach(s => { seatByNumber[s.seat_number] = s })

  return (
    <div className="overflow-x-auto pb-2">
      {/* Scale down on mobile */}
      <div style={{ minWidth: w }}>
        <div
          className="relative rounded-2xl border border-kayan-border"
          style={{
            width: w, height: h,
            background: 'rgba(11,11,22,0.6)',
          }}
        >
          {/* Room boundary */}
          <div className="absolute inset-0 rounded-2xl"
               style={{ border: '2px solid rgba(201,168,76,0.12)' }} />

          {/* Door indicator */}
          {door && (
            <div
              className="absolute text-[9px] text-kayan-gold/60 font-medium
                         bg-kayan-gold/10 px-1.5 py-0.5 rounded-sm border border-kayan-gold/20"
              style={{
                left: door.x,
                top:  door.y,
              }}
            >
              {door.label}
            </div>
          )}

          {/* Furniture */}
          {furniture.map((f, i) => {
            const style = FURNITURE_STYLE[f.type] ?? FURNITURE_STYLE.table
            return (
              <div
                key={i}
                className="absolute rounded-lg flex items-center justify-center"
                style={{
                  left:        f.x,
                  top:         f.y,
                  width:       f.w,
                  height:      f.h,
                  background:  style.bg,
                  border:      `1.5px solid ${style.border}`,
                }}
              >
                {f.label && (
                  <span className="text-[8px] text-kayan-muted tracking-wide select-none">
                    {f.label}
                  </span>
                )}
              </div>
            )
          })}

          {/* Seats */}
          {positions.map((pos, idx) => {
            const seatNum = idx + 1
            const seat    = seatByNumber[seatNum]
            if (!seat) return null

            const isOcc  = seat.is_occupied
            const [px, py] = pos

            return (
              <motion.button
                key={seat.id}
                whileHover={isAdmin ? { scale: 1.18 } : {}}
                whileTap={isAdmin ? { scale: 0.92 } : {}}
                onClick={() => isAdmin && onSeatClick?.(seat)}
                title={`Seat ${seatNum} · ${isOcc ? 'Occupied' : 'Available'}`}
                className={`
                  absolute select-none
                  w-8 h-8 rounded-lg text-[10px] font-bold
                  flex items-center justify-center
                  border transition-colors duration-150
                  ${isOcc
                    ? 'bg-red-500/18 border-red-500/45 text-red-400'
                    : 'bg-green-500/14 border-green-500/45 text-green-400'
                  }
                  ${isAdmin ? 'cursor-pointer' : 'cursor-default'}
                `}
                style={{
                  left: px - 16,   // center on position
                  top:  py - 16,
                  boxShadow: isOcc
                    ? '0 0 8px rgba(239,68,68,0.15)'
                    : '0 0 8px rgba(34,197,94,0.12)',
                }}
              >
                {seatNum}
              </motion.button>
            )
          })}
        </div>
      </div>
    </div>
  )
}