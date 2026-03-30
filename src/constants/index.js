// ─────────────────────────────────────────────────────────────
//  Kayan — App-wide Constants
// ─────────────────────────────────────────────────────────────

// ── Billing ──────────────────────────────────────────────────
export const BILLING = {
  HOURLY_RATE: 15,   // EGP per hour
  DAILY_CAP:   75,   // EGP max per day
  CAP_HOURS:   6,    // hours before cap kicks in
  MIN_CHARGE:  15,   // minimum charge (1 hour)
}

// ── Room definitions (mirrors DB seed) ───────────────────────
export const ROOMS = [
  { id: 1, name: 'Room 1', ar: 'غرفة ١', cap: 12, floor: 'Ground' },
  { id: 2, name: 'Room 2', ar: 'غرفة ٢', cap: 15, floor: 'Ground' },
  { id: 3, name: 'Room 3', ar: 'غرفة ٣', cap: 12, floor: 'First'  },
  { id: 4, name: 'Room 4', ar: 'غرفة ٤', cap: 18, floor: 'First'  },
  { id: 5, name: 'Room 5', ar: 'غرفة ٥', cap: 15, floor: 'Second' },
  { id: 6, name: 'Roof ☀️', ar: 'السطح',  cap: 18, floor: 'Roof'   },
]

// ── Menu categories ───────────────────────────────────────────
export const MENU_CATEGORIES = ['hot', 'cold', 'food', 'other']
export const MENU_CATEGORY_LABELS = {
  hot:   { label: 'Hot',    icon: '☕' },
  cold:  { label: 'Cold',   icon: '🥤' },
  food:  { label: 'Food',   icon: '🍿' },
  other: { label: 'Other',  icon: '✦'  },
}

// ── Order / Session statuses ──────────────────────────────────
export const ORDER_STATUS = {
  pending:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.1)',   label: 'Pending'     },
  preparing: { color: '#818CF8', bg: 'rgba(129,140,248,0.1)',  label: 'Preparing'   },
  ready:     { color: '#22C55E', bg: 'rgba(34,197,94,0.1)',    label: 'Ready ✓'     },
  delivered: { color: '#6B7280', bg: 'rgba(107,114,128,0.1)', label: 'Delivered'   },
  cancelled: { color: '#EF4444', bg: 'rgba(239,68,68,0.1)',    label: 'Cancelled'   },
}

export const ORDER_NEXT_STATUS = {
  pending:   'preparing',
  preparing: 'ready',
  ready:     'delivered',
}

export const ORDER_NEXT_LABEL = {
  pending:   '→ Preparing',
  preparing: '→ Ready',
  ready:     '→ Delivered',
}

export const SESSION_STATUS = {
  active:       'active',
  checked_out:  'checked_out',
  cancelled:    'cancelled',
}

// ── User roles ────────────────────────────────────────────────
export const ROLES = {
  ADMIN:    'admin',
  STAFF:    'staff',
  CUSTOMER: 'customer',
}

// ── Realtime channel names ────────────────────────────────────
export const CHANNELS = {
  ORDERS:   'kayan-orders',
  SEATS:    'kayan-seats',
  SESSIONS: 'kayan-sessions',
}

// ── Billing utils (pure functions — no imports needed) ────────
export function calcBill(checkIn, ordersTotal = 0, pkg = {}) {
  const rate     = pkg.hourly_rate ?? BILLING.HOURLY_RATE
  const cap      = pkg.daily_cap   ?? BILLING.DAILY_CAP
  const capHours = pkg.cap_hours   ?? BILLING.CAP_HOURS

  const hours    = (Date.now() - new Date(checkIn)) / 3_600_000
  const capped   = capHours > 0 && hours > capHours
  const stayCost = capped
    ? cap
    : Math.max(BILLING.MIN_CHARGE, Math.ceil(hours * rate))

  return {
    hours:      +hours.toFixed(2),
    hoursLabel: `${hours.toFixed(1)}h`,
    stayCost,
    ordersTotal,
    total:      stayCost + ordersTotal,
    capped,
  }
}

export function ago(date) {
  const m = Math.floor((Date.now() - new Date(date)) / 60_000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ${m % 60}m ago`
}
