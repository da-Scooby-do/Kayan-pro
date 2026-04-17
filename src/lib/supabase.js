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
 *
 * Phone strategy (two-layer):
 *  1. Store phone in auth user_metadata — always works, never blocked by RLS.
 *  2. Try an immediate profile update (works when email confirmation is OFF).
 *     If it fails silently (email confirmation ON → user not yet authenticated),
 *     loadProfileInto() will sync the phone from metadata on first real sign-in.
 */
export async function signUp({ email, password, fullName, phone }) {
  const cleanPhone = phone?.trim() || null

  // Step 1: create auth user — include phone in metadata as the reliable backup
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: fullName,
        role:      'customer',
        phone:     cleanPhone,   // ← stored in auth.users.raw_user_meta_data
      },
    },
  })
  if (error) throw error

  // Step 2: best-effort immediate profile update.
  // Works when email confirmation is disabled (user is already authenticated).
  // When confirmation is required this runs unauthenticated and RLS will block
  // it — that's fine, loadProfileInto() handles the sync after real sign-in.
  if (data?.user?.id && cleanPhone) {
    await supabase
      .from('profiles')
      .update({ phone: cleanPhone })
      .eq('id', data.user.id)
    // Intentionally not throwing on error — phone sync is handled on sign-in
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

/** Fetch the profile row for a given auth user id.
 *  Uses maybeSingle() so 0 rows returns null instead of a 406 error.
 *  This matters for brand-new accounts where the handle_new_user trigger
 *  may not have finished writing the row yet.
 */
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle()          // null on 0 rows — never throws a 406
  if (error) throw error
  return data               // null if profile not created yet
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
    .select('id, full_name, phone, role, created_at, username, outstanding_debt')
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

/** Admin: open or close a room (maintenance / reserved). */
export async function toggleRoomClosed(roomId, closed, reason = null) {
  const { data, error } = await supabase.rpc('toggle_room_closed', {
    p_room_id: roomId,
    p_closed:  closed,
    p_reason:  reason,
  })
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
export async function checkoutSession(sessionId, adminId, overrideAmount = null) {
  const { data, error } = await supabase.rpc('checkout_session', {
    p_session_id:      sessionId,
    p_admin_id:        adminId ?? null,
    p_override_amount: overrideAmount !== null ? Number(overrideAmount) : null,
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

/** Admin: fetch ALL menu items (including unavailable ones). */
export async function fetchAllMenuItems() {
  const { data, error } = await supabase
    .from('menu_items')
    .select('*')
    .order('category')
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

/** Admin: toggle a menu item's availability. */
export async function toggleMenuItemAvailability(itemId, isAvailable) {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ is_available: isAvailable, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select().single()
  if (error) throw error
  return data
}

/** Admin: add a new menu item. */
export async function addMenuItem({ name, name_ar, emoji, category, price, sort_order }) {
  const { data, error } = await supabase
    .from('menu_items')
    .insert({ name, name_ar, emoji, category, price, sort_order: sort_order ?? 99, is_available: true })
    .select().single()
  if (error) throw error
  return data
}

/** Admin: edit an existing menu item. */
export async function editMenuItem(itemId, updates) {
  const { data, error } = await supabase
    .from('menu_items')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', itemId)
    .select().single()
  if (error) throw error
  return data
}

/** Admin: delete a menu item. */
export async function deleteMenuItem(itemId) {
  const { error } = await supabase
    .from('menu_items')
    .delete()
    .eq('id', itemId)
  if (error) throw error
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

// ═══════════════════════════════════════════════════════════
//  SUBSCRIPTIONS
// ═══════════════════════════════════════════════════════════

export async function fetchSubscriptionPlans() {
  const { data, error } = await supabase
    .from('subscription_plans')
    .select('*')
    .eq('is_active', true)
    .order('sort_order')
  if (error) throw error
  return data ?? []
}

export async function fetchMySubscription(userId) {
  const { data, error } = await supabase
    .rpc('get_active_subscription', { p_user_id: userId })
  if (error) throw error
  return data?.[0] ?? null
}

export async function activateSubscription({ userId, planId, adminId, notes }) {
  const { data, error } = await supabase.rpc('activate_subscription', {
    p_user_id:  userId,
    p_plan_id:  planId,
    p_admin_id: adminId ?? null,
    p_notes:    notes ?? null,
  })
  if (error) throw error
  return data
}

export async function fetchCustomerSubscriptions() {
  const { data, error } = await supabase
    .from('customer_subscriptions_view')
    .select('*')
  if (error) throw error
  return data ?? []
}

/** Admin: extend an active 10 or 20-day subscription by 5 or 10 extra days. */
export async function extendSubscription({ userId, extraDays, amount, adminId }) {
  const { data, error } = await supabase.rpc('extend_subscription', {
    p_user_id:    userId,
    p_extra_days: extraDays,
    p_amount:     amount,
    p_admin_id:   adminId ?? null,
  })
  if (error) throw error
  if (!data?.success) throw new Error(data?.error ?? 'Extension failed')
  return data
}

export async function cancelSubscription(subId) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', subId)
    .select().single()
  if (error) throw error
  return data
}

// ═══════════════════════════════════════════════════════════
//  DEBT SYSTEM
// ═══════════════════════════════════════════════════════════

export async function registerDebt(sessionId, adminId) {
  const { data, error } = await supabase.rpc('register_debt', {
    p_session_id: sessionId,
    p_admin_id:   adminId ?? null,
  })
  if (error) throw error
  // Supabase may return JSONB as a plain object or as a JSON string
  try {
    return typeof data === 'string' ? JSON.parse(data) : data
  } catch {
    return data
  }
}

export async function payDebt(userId, adminId) {
  const { data, error } = await supabase.rpc('pay_debt', {
    p_user_id:  userId,
    p_admin_id: adminId ?? null,
  })
  if (error) throw error
  return data
}

export async function fetchDebts() {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, username, phone, outstanding_debt')
    .gt('outstanding_debt', 0)
    .order('outstanding_debt', { ascending: false })
  if (error) throw error
  return data ?? []
}

// ═══════════════════════════════════════════════════════════
//  INVITATION SYSTEM
// ═══════════════════════════════════════════════════════════

export async function useInvitation(inviterId) {
  const { data, error } = await supabase.rpc('use_invitation', {
    p_inviter_id: inviterId,
  })
  if (error) throw error
  return data
}

/**
 * BUG-02 FIX: Compensating rollback — restores 1 invitation if open_session fails
 * after use_invitation already decremented the count.
 * NOTE: This is best-effort. A proper atomic solution requires merging the decrement
 * into the open_session DB function.
 */
async function restoreInvitation(inviterId) {
  try {
    await supabase.rpc('restore_invitation', { p_inviter_id: inviterId })
  } catch {
    // Silent — if rollback fails, log for manual reconciliation
    console.error('[Kayan] CRITICAL: Invitation decrement could not be rolled back for', inviterId)
  }
}

export async function openInvitationSession({ userId, seatId, packageId = 1, adminId, inviterId }) {
  // Step 1: Decrement the invitation count
  const invResult = await useInvitation(inviterId)
  if (!invResult?.ok) {
    throw new Error(invResult?.reason ?? 'No invitations remaining')
  }

  // Step 2: Open the session (BUG-03 FIX: removed invalid p_inviter_id from open_session)
  const { data, error } = await supabase.rpc('open_session', {
    p_user_id:    userId,
    p_seat_id:    seatId,
    p_package_id: packageId,
    p_admin_id:   adminId ?? null,
  })

  if (error) {
    // BUG-02 FIX: Compensate by restoring the invitation credit
    await restoreInvitation(inviterId)
    throw error
  }

  return { session: data, invitationsRemaining: invResult.remaining }
}

// ═══════════════════════════════════════════════════════════
//  INVITATION CODES
// ═══════════════════════════════════════════════════════════

/** Subscriber: generate a new single-use invite code for their sub. */
export async function generateInvitationCode(inviterId, subId) {
  const { data, error } = await supabase
    .from('invitation_codes')
    .insert({ inviter_id: inviterId, sub_id: subId })
    .select()
    .single()
  if (error) throw error
  return data
}

/** Subscriber: fetch all codes they've ever generated. */
export async function fetchMyInvitationCodes(inviterId) {
  const { data, error } = await supabase
    .from('invitation_codes')
    .select('*')
    .eq('inviter_id', inviterId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Admin: look up an invite code → returns the inviter's profile + subscription info. */
export async function lookupInvitationCode(code) {
  // Use ilike for case-insensitive match — admin codes are UPPERCASE, subscriber codes lowercase
  const { data, error } = await supabase
    .from('invitation_codes')
    .select(`
      id, code, used, expires_at, used_at,
      inviter:profiles!inviter_id ( id, full_name, phone, username ),
      sub:user_subscriptions!sub_id ( id, invitations_remaining, status )
    `)
    .ilike('code', code.trim())
    .eq('used', false)
    .gt('expires_at', new Date().toISOString())
    .maybeSingle()
  if (error) throw error
  return data   // null if not found / expired / already used
}

/**
 * Admin: apply an invitation to an already-open session at checkout time.
 * - Decrements the inviter's invitation count
 * - Sets is_subscription_session = true so stay cost becomes 0
 */
export async function applyInvitationToSession(sessionId, inviterId) {
  // Step 1: decrement the inviter's count
  const { data: invData, error: invErr } = await supabase.rpc('use_invitation', {
    p_inviter_id: inviterId,
  })
  if (invErr) throw invErr
  if (!invData?.ok) throw new Error(invData?.reason ?? 'No invitations remaining')

  // Step 2: mark session so checkout calculates stay = 0
  const { error: sessErr } = await supabase
    .from('sessions')
    .update({ is_subscription_session: true })
    .eq('id', sessionId)
    .eq('status', 'active')
  if (sessErr) {
    // Best-effort rollback of the invitation decrement
    await supabase.rpc('restore_invitation', { p_inviter_id: inviterId }).catch(() => {})
    throw sessErr
  }

  return { invitations_remaining: invData.remaining }
}

// ═══════════════════════════════════════════════════════════
//  ADMIN INVITATION CREDITS
// ═══════════════════════════════════════════════════════════

/** Admin: generate one invite code (calls DB function, consumes 1 credit). */
export async function generateAdminInviteCode(adminId) {
  const { data, error } = await supabase.rpc('generate_admin_invite', {
    p_admin_id: adminId,
  })
  if (error) throw error
  if (!data?.ok) throw new Error(data?.reason ?? 'Could not generate invite code')
  return data  // { ok, code, remaining }
}

/** Admin: fetch all codes this admin has generated. */
export async function fetchAdminInviteCodes(adminId) {
  const { data, error } = await supabase
    .from('invitation_codes')
    .select('*')
    .eq('inviter_id', adminId)
    .is('sub_id', null)          // admin codes only
    .order('created_at', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Admin: get invite credit info (total and used). */
export async function fetchAdminInviteCredits(adminId) {
  const { data: profile, error: pErr } = await supabase
    .from('profiles')
    .select('invite_credits')
    .eq('id', adminId)
    .single()
  if (pErr) throw pErr

  const { count, error: cErr } = await supabase
    .from('invitation_codes')
    .select('id', { count: 'exact', head: true })
    .eq('inviter_id', adminId)
    .is('sub_id', null)
  if (cErr) throw cErr

  return {
    total: profile.invite_credits ?? 0,
    used:  count ?? 0,
    remaining: (profile.invite_credits ?? 0) - (count ?? 0),
  }
}

export async function fetchInviterInfo(userId) {
  const { data, error } = await supabase
    .from('user_subscriptions')
    .select('id, invitations_remaining, status, plan:subscription_plans(name)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) return null
  return data
}