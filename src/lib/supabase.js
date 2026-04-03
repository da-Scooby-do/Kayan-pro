// ─────────────────────────────────────────────────────────────
//  Kayan — Supabase Client
//  Single client instance shared across the whole app.
//  All DB helper functions live here so components never import
//  @supabase/supabase-js directly.
// ─────────────────────────────────────────────────────────────
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL  = import.meta.env.VITE_SUPABASE_URL
const SUPABASE_ANON = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!SUPABASE_URL || !SUPABASE_ANON) {
  throw new Error(
    '[Kayan] Missing Supabase env vars. ' +
    'Copy .env.example → .env and fill in your project credentials.'
  )
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON, {
  auth: {
    autoRefreshToken:    true,
    persistSession:      true,
    detectSessionInUrl:  true,
  },
  realtime: {
    params: { eventsPerSecond: 10 },
  },
})

// ═══════════════════════════════════════════════════════════
//  AUTH HELPERS
// ═══════════════════════════════════════════════════════════

/**
 * Sign up a new customer.
 * Creates the auth user; the `handle_new_user` DB trigger
 * automatically inserts the profile row.
 */
export async function signUp({ email, password, fullName, phone }) {
  // Step 1: create auth user
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { full_name: fullName, role: 'customer' } },
  })
  if (error) throw error

  // Step 2: update the profile row with phone number
  // The handle_new_user trigger creates the profile row immediately,
  // but doesn't include phone — we update it right after signup.
  if (data?.user?.id && phone) {
    await supabase
      .from('profiles')
      .update({ phone: phone.trim() })
      .eq('id', data.user.id)
  }

  return data
}

/** Sign in an existing user. */
export async function signIn({ email, password }) {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw error
  return data
}

/** Sign out current user. */
export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

/** Fetch the profile row for a given auth user id. */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

/** Update display name or phone for the current user. */
export async function updateProfile(userId, updates) {
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ═══════════════════════════════════════════════════════════
//  CUSTOMERS  (admin-only queries)
// ═══════════════════════════════════════════════════════════

/**
 * Admin: fetch all customer profiles (role = 'customer').
 * Requires the caller to have admin role (enforced by RLS).
 */
export async function fetchCustomers() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, phone, role, created_at')
    .eq('role', 'customer')
    .order('full_name')
  if (error) throw error
  return data ?? []
}

/**
 * Admin: check whether a customer already has an active session.
 * Used to prevent double check-in.
 */
export async function fetchCustomerActiveSession(userId) {
  const { data, error } = await supabase
    .from('sessions')
    .select('id, seat_id, check_in')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()
  if (error) throw error
  return data
}

// ═══════════════════════════════════════════════════════════
//  ROOMS & SEATS
// ═══════════════════════════════════════════════════════════

/** Fetch all active rooms. */
export async function fetchRooms() {
  const { data, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return data
}

/**
 * Fetch all seats for every room.
 * Returns a map: { [roomId]: Seat[] }
 */
export async function fetchAllSeats() {
  const { data, error } = await supabase
    .from('seats')
    .select('id, room_id, seat_number, is_occupied, current_session_id')
    .order('seat_number')
  if (error) throw error

  // Group by room_id
  return (data ?? []).reduce((map, seat) => {
    if (!map[seat.room_id]) map[seat.room_id] = []
    map[seat.room_id].push(seat)
    return map
  }, {})
}

/**
 * Admin: toggle a single seat's occupied status directly.
 * (Used for manual override outside a session flow.)
 */
export async function toggleSeatOccupancy(seatId, occupied) {
  const { data, error } = await supabase
    .from('seats')
    .update({ is_occupied: occupied, updated_at: new Date().toISOString() })
    .eq('id', seatId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ═══════════════════════════════════════════════════════════
//  SESSIONS
// ═══════════════════════════════════════════════════════════

/**
 * Fetch all currently active sessions (admin view).
 * Joins profiles and rooms via the active_sessions_view.
 */
export async function fetchActiveSessions() {
  const { data, error } = await supabase
    .from('active_sessions_view')
    .select('*')
    .order('check_in')
  if (error) throw error
  return data ?? []
}

/**
 * Fetch the active session for a specific user (customer view).
 * Returns null if no active session.
 */
export async function fetchMyActiveSession(userId) {
  // Flat query — avoids silent RLS failures on nested joins
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    console.error('[Kayan] fetchMyActiveSession error:', error)
    throw error
  }
  if (!data) return null

  // Fetch related data separately so each table's RLS is clear
  const { data: seat } = await supabase
    .from('seats')
    .select('id, seat_number, room_id')
    .eq('id', data.seat_id)
    .maybeSingle()

  const { data: room } = seat ? await supabase
    .from('rooms')
    .select('id, name, name_ar')
    .eq('id', seat.room_id)
    .maybeSingle() : { data: null }

  const { data: pkg } = await supabase
    .from('packages')
    .select('hourly_rate, daily_cap, cap_hours')
    .eq('id', data.package_id)
    .maybeSingle()

  return { ...data, seat: seat ? { ...seat, room } : null, package: pkg ?? null }
}

/**
 * Admin: call the open_session() PostgreSQL function.
 * Creates the session row and marks the seat occupied atomically.
 */
export async function openSession({ userId, seatId, packageId = 1, adminId }) {
  const { data, error } = await supabase.rpc('open_session', {
    p_user_id:    userId,
    p_seat_id:    seatId,
    p_package_id: packageId,
    p_admin_id:   adminId ?? null,
  })
  if (error) throw error
  return data
}

/**
 * Admin: call the checkout_session() PostgreSQL function.
 * Calculates final bill (with cap), closes the session, frees the seat.
 */
export async function checkoutSession(sessionId, adminId) {
  const { data, error } = await supabase.rpc('checkout_session', {
    p_session_id: sessionId,
    p_admin_id:   adminId ?? null,
  })
  if (error) throw error
  return data
}

/**
 * Call calculate_session_cost() to get a live bill preview.
 * Returns { hours_stayed, stay_cost, orders_total, total_cost, is_capped }
 */
export async function getSessionCost(sessionId) {
  const { data, error } = await supabase.rpc('calculate_session_cost', {
    p_session_id: sessionId,
  })
  if (error) throw error
  return data?.[0] ?? null
}

// ═══════════════════════════════════════════════════════════
//  MENU
// ═══════════════════════════════════════════════════════════

/** Fetch all available menu items. */
export async function fetchMenu() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .eq('is_available', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

// ═══════════════════════════════════════════════════════════
//  ORDERS
// ═══════════════════════════════════════════════════════════

/**
 * Admin: fetch all pending/preparing orders with customer & room context.
 * Uses the pending_orders_view created in the schema.
 */
export async function fetchPendingOrders() {
  const { data, error } = await supabase
    .from('pending_orders_view')
    .select('*')
    .order('created_at')
  if (error) throw error
  return data ?? []
}

/**
 * Fetch all orders belonging to a specific session.
 */
export async function fetchSessionOrders(sessionId) {
  const { data, error } = await supabase
    .from('orders')
    .select(`*, item:menu_items ( name, name_ar, emoji, price )`)
    .eq('session_id', sessionId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/**
 * Customer: place one or more orders.
 * Each cart item becomes a separate order row (easier for kitchen).
 */
export async function placeOrders(sessionId, cartItems) {
  const rows = cartItems.map(item => ({
    session_id:   sessionId,
    menu_item_id: item.id,
    quantity:     item.qty,
    unit_price:   item.price,
  }))

  const { data, error } = await supabase
    .from('orders')
    .insert(rows)
    .select()
  if (error) throw error
  return data
}

/**
 * Admin/Staff: advance an order's status.
 */
export async function updateOrderStatus(orderId, status) {
  const { data, error } = await supabase
    .from('orders')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', orderId)
    .select()
    .single()
  if (error) throw error
  return data
}

// ═══════════════════════════════════════════════════════════
//  REALTIME CHANNEL BUILDERS
//  Call these from hooks; they return the channel object so
//  the hook can call channel.unsubscribe() on cleanup.
// ═══════════════════════════════════════════════════════════

/**
 * Subscribe to new / updated orders (admin order queue).
 * @param {Function} onInsert  called when a new order arrives
 * @param {Function} onUpdate  called when an order status changes
 */
export function subscribeToOrders(onInsert, onUpdate) {
  return supabase
    .channel('kayan-orders')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'orders' },
      payload => onInsert(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders' },
      payload => onUpdate(payload.new)
    )
    .subscribe()
}

/**
 * Subscribe to seat updates (live seat map).
 */
export function subscribeToSeats(onChange) {
  return supabase
    .channel('kayan-seats')
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'seats' },
      payload => onChange(payload.new)
    )
    .subscribe()
}

/**
 * Subscribe to session changes (admin sessions list).
 */
export function subscribeToSessions(onInsert, onUpdate) {
  return supabase
    .channel('kayan-sessions')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'sessions' },
      payload => onInsert(payload.new)
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'sessions' },
      payload => onUpdate(payload.new)
    )
    .subscribe()
}

// ═══════════════════════════════════════════════════════════
//  SEAT TRANSFER
// ═══════════════════════════════════════════════════════════

/**
 * Fetch the active session sitting in a specific seat.
 * Used by the Change Seat modal to show who's in a red seat.
 */
export async function fetchSessionBySeat(seatId) {
  // Step 1: get the session (flat — no joins that might hit RLS)
  const { data: session, error } = await supabase
    .from('sessions')
    .select('id, seat_id, check_in, orders_total, user_id')
    .eq('seat_id', seatId)
    .eq('status', 'active')
    .maybeSingle()

  if (error) {
    console.error('[Kayan] fetchSessionBySeat error:', error)
    throw error
  }
  if (!session) return null

  // Step 2: fetch profile separately
  const { data: customer } = await supabase
    .from('profiles')
    .select('id, full_name, username')
    .eq('id', session.user_id)
    .maybeSingle()

  return { ...session, customer: customer ?? null }
}

/**
 * Admin: move a customer from their current seat to a new one.
 * Calls the move_session_seat() PG function atomically.
 */
export async function moveSessionSeat(sessionId, newSeatId, adminId) {
  const { data, error } = await supabase.rpc('move_session_seat', {
    p_session_id:  sessionId,
    p_new_seat_id: newSeatId,
    p_admin_id:    adminId ?? null,
  })
  if (error) throw error
  return data
}