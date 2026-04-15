// ─────────────────────────────────────────────────────────────
//  useKayan — Master database-interaction hook
//
//  Every component that needs to read or mutate data calls into
//  this hook. It updates the Zustand store on success and
//  surfaces errors via the toast system.
//
//  RULE: No component ever imports from @/lib/supabase directly.
//        Everything flows through here.
// ─────────────────────────────────────────────────────────────
import { useCallback } from 'react'
import {
  fetchRooms,
  fetchAllSeats,
  fetchActiveSessions,
  fetchMyActiveSession,
  fetchMenu,
  fetchAllMenuItems,
  toggleMenuItemAvailability,
  addMenuItem,
  editMenuItem,
  deleteMenuItem,
  fetchPendingOrders,
  fetchSessionOrders,
  fetchCustomers,
  fetchCustomerActiveSession,
  placeOrders,
  updateOrderStatus,
  openSession,
  checkoutSession,
  getSessionCost,
  toggleSeatOccupancy,
  fetchSessionBySeat,
  moveSessionSeat,
  fetchSubscriptionPlans,
  fetchMySubscription,
  activateSubscription,
  fetchCustomerSubscriptions,
  cancelSubscription,
  extendSubscription,
  // Debt
  registerDebt,
  payDebt,
  fetchDebts,
  // Invitations
  openInvitationSession,
  fetchInviterInfo,
  // Invitation codes
  generateInvitationCode,
  fetchMyInvitationCodes,
  lookupInvitationCode,
  applyInvitationToSession,
} from '@/lib/supabase'
import useKayanStore from '@/store/useKayanStore'

export function useKayan() {
  // Simple store subscription — correct pattern for a hook used inside components
  const store = useKayanStore()

  // ── Rooms + Seats ───────────────────────────────────────────

  const loadRooms = useCallback(async () => {
    try {
      const rooms = await fetchRooms()
      store.setRooms(rooms)
      return rooms
    } catch (err) {
      store.showToast(`Failed to load rooms: ${err.message}`, 'error')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadSeats = useCallback(async () => {
    try {
      const seats = await fetchAllSeats()
      store.setSeats(seats)
      return seats
    } catch (err) {
      store.showToast(`Failed to load seats: ${err.message}`, 'error')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Admin: manually toggle a seat (outside a session).
   * Optimistically updates the store, then syncs with DB.
   */
  const handleToggleSeat = useCallback(async (seatId, roomId, currentlyOccupied) => {
    // Optimistic update for instant UI feedback
    store.optimisticToggleSeat(seatId, roomId)
    try {
      await toggleSeatOccupancy(seatId, !currentlyOccupied)
    } catch (err) {
      // Roll back on failure
      store.optimisticToggleSeat(seatId, roomId)
      store.showToast(`Toggle failed: ${err.message}`, 'error')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Menu ────────────────────────────────────────────

  const loadMenu = useCallback(async () => {
    try {
      const menu = await fetchMenu()
      store.setMenu(menu)
      return menu
    } catch (err) {
      store.showToast(`Failed to load menu: ${err.message}`, 'error')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // BUG-05+06 FIX: Admin menu management moved into hook (no direct supabase in components)
  const loadAllMenu = useCallback(async () => {
    try {
      const menu = await fetchAllMenuItems()
      return menu
    } catch (err) {
      store.showToast(`Failed to load menu: ${err.message}`, 'error')
      return []
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggleMenuAvailability = useCallback(async (item) => {
    try {
      await toggleMenuItemAvailability(item.id, !item.is_available)
      store.showToast(`${item.name} is now ${!item.is_available ? 'Available' : 'Out of Stock'}`, 'ok')
    } catch (err) {
      store.showToast(`Failed to update ${item.name}: ${err.message}`, 'error')
      throw err
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleAddMenuItem = useCallback(async (itemData) => {
    try {
      const item = await addMenuItem(itemData)
      store.showToast(`✓ ${item.name} added to menu`, 'ok')
      return item
    } catch (err) {
      store.showToast(`Failed to add item: ${err.message}`, 'error')
      throw err
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleEditMenuItem = useCallback(async (id, updates) => {
    try {
      const item = await editMenuItem(id, updates)
      store.showToast(`✓ ${item.name} updated`, 'ok')
      return item
    } catch (err) {
      store.showToast(`Failed to update item: ${err.message}`, 'error')
      throw err
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleDeleteMenuItem = useCallback(async (item) => {
    try {
      await deleteMenuItem(item.id)
      store.showToast(`${item.name} removed from menu`, 'info')
    } catch (err) {
      store.showToast(`Failed to delete item: ${err.message}`, 'error')
      throw err
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Admin: Customers ─────────────────────────────────────────

  const loadCustomers = useCallback(async () => {
    store.setCustomersLoading(true)
    try {
      const customers = await fetchCustomers()
      store.setCustomers(customers)
      return customers
    } catch (err) {
      store.showToast(`Failed to load customers: ${err.message}`, 'error')
    } finally {
      store.setCustomersLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const checkCustomerSession = useCallback(async (userId) => {
    try {
      return await fetchCustomerActiveSession(userId)
    } catch {
      return null
    }
  }, [])

  // ── Admin: Sessions ─────────────────────────────────────────

  const loadActiveSessions = useCallback(async () => {
    store.setSessionsLoading(true)
    try {
      const sessions = await fetchActiveSessions()
      store.setSessions(sessions)
      return sessions
    } catch (err) {
      store.showToast(`Failed to load sessions: ${err.message}`, 'error')
    } finally {
      store.setSessionsLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Admin: open a new session.
   * @param {{ userId, seatId, packageId?, adminId }} params
   */
  const handleOpenSession = useCallback(async (params) => {
    try {
      const session = await openSession(params)
      // Refresh both sessions and seats
      await Promise.all([loadActiveSessions(), loadSeats()])
      store.showToast(`✓ Session opened for seat ${params.seatId}`, 'ok')
      return session
    } catch (err) {
      store.showToast(`Open session failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadActiveSessions, loadSeats]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Admin: checkout a session.
   * Calls the checkout_session() PG function which:
   *   • calculates final bill with daily cap
   *   • marks session as checked_out
   *   • frees the seat
   */
  const handleCheckout = useCallback(async (sessionId, adminId) => {
    try {
      const result = await checkoutSession(sessionId, adminId)
      store.removeSession(sessionId)
      await loadSeats()
      store.showToast(`✓ Checkout complete — ${result.total_cost} EGP collected.`, 'ok')
      return result
    } catch (err) {
      store.showToast(`Checkout failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadSeats]) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Get a live bill preview for a session without checking out.
   */
  const getLiveBill = useCallback(async (sessionId) => {
    try {
      return await getSessionCost(sessionId)
    } catch (err) {
      store.showToast(`Bill calculation failed: ${err.message}`, 'error')
      return null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Admin: Orders ───────────────────────────────────────────

  const loadPendingOrders = useCallback(async () => {
    store.setOrdersLoading(true)
    try {
      const orders = await fetchPendingOrders()
      store.setOrders(orders)
      return orders
    } catch (err) {
      store.showToast(`Failed to load orders: ${err.message}`, 'error')
    } finally {
      store.setOrdersLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Admin/Staff: advance an order to the next status.
   */
  const handleUpdateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus)
      store.patchOrder(updated)
      const labels = { preparing: '⏳ Preparing…', ready: '✓ Order ready — customer notified.', delivered: '✓ Delivered.' }
      store.showToast(labels[newStatus] ?? 'Order updated.', 'ok')
      return updated
    } catch (err) {
      store.showToast(`Update failed: ${err.message}`, 'error')
      throw err
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Customer ────────────────────────────────────────────────

  const loadMySession = useCallback(async (userId) => {
    try {
      const session = await fetchMyActiveSession(userId)
      store.setMySession(session)
      return session
    } catch (err) {
      store.showToast(`Could not load your session: ${err.message}`, 'error')
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const loadMyOrders = useCallback(async (sessionId) => {
    store.setMyOrdersLoading(true)
    try {
      const orders = await fetchSessionOrders(sessionId)
      store.setMyOrders(orders)
      return orders
    } catch (err) {
      store.showToast(`Could not load your orders: ${err.message}`, 'error')
    } finally {
      store.setMyOrdersLoading(false)
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  /**
   * Customer: place all items currently in the cart.
   * Clears the cart on success.
   */
  const handlePlaceOrder = useCallback(async (sessionId, cart) => {
    if (!cart.length) return
    try {
      const newOrders = await placeOrders(sessionId, cart)
      newOrders.forEach(o => store.addMyOrder(o))
      store.clearCart()
      store.showToast('🛎 Order placed! We\'ll notify you when it\'s ready.', 'ok')
      return newOrders
    } catch (err) {
      store.showToast(`Order failed: ${err.message}`, 'error')
      throw err
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Admin: Move seat ────────────────────────────────────────

  const getSessionBySeat = useCallback(async (seatId) => {
    try {
      return await fetchSessionBySeat(seatId)
    } catch (err) {
      store.showToast(`Could not load seat info: ${err.message}`, 'error')
      return null
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  const handleMoveSeat = useCallback(async (sessionId, newSeatId) => {
    try {
      await moveSessionSeat(sessionId, newSeatId, store.profile?.id)
      await loadSeats()
      store.showToast('✓ Seat changed successfully.', 'ok')
    } catch (err) {
      store.showToast(`Move failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadSeats]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Subscriptions ────────────────────────────────────────

  const loadSubscriptionPlans = useCallback(async () => {
    try {
      const plans = await fetchSubscriptionPlans()
      store.setSubscriptionPlans(plans)
      return plans
    } catch (err) {
      store.showToast(`Failed to load plans: ${err.message}`, 'error')
    }
  }, []) // eslint-disable-line

  const loadMySubscription = useCallback(async (userId) => {
    try {
      const sub = await fetchMySubscription(userId)
      store.setMySubscription(sub)
      return sub
    } catch (err) {
      store.showToast(`Could not load subscription: ${err.message}`, 'error')
    }
  }, []) // eslint-disable-line

  const loadCustomerSubs = useCallback(async () => {
    try {
      const subs = await fetchCustomerSubscriptions()
      store.setCustomerSubs(subs)
      return subs
    } catch (err) {
      store.showToast(`Failed to load subscriptions: ${err.message}`, 'error')
    }
  }, []) // eslint-disable-line

  const handleActivateSub = useCallback(async ({ userId, planId, notes }) => {
    try {
      await activateSubscription({ userId, planId, adminId: store.profile?.id, notes })
      await loadCustomerSubs()
      store.showToast('✓ Subscription activated!', 'ok')
    } catch (err) {
      store.showToast(`Activation failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadCustomerSubs]) // eslint-disable-line

  /** Admin: extend a 10 or 20-day subscription by 5 or 10 days. */
  const handleExtendSub = useCallback(async ({ userId, extraDays, amount }) => {
    try {
      const result = await extendSubscription({
        userId, extraDays, amount,
        adminId: store.profile?.id,
      })
      await loadCustomerSubs()
      store.showToast(`✓ +${extraDays} days added — ${amount} EGP collected`, 'ok')
      return result
    } catch (err) {
      store.showToast(`Extension failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadCustomerSubs]) // eslint-disable-line

  const handleCancelSub = useCallback(async (subId) => {
    try {
      await cancelSubscription(subId)
      await loadCustomerSubs()
      store.showToast('Subscription cancelled.', 'info')
    } catch (err) {
      store.showToast(`Cancel failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadCustomerSubs]) // eslint-disable-line

  // ── Debt Actions ──────────────────────────────────────

  const loadDebts = useCallback(async () => {
    try {
      const debts = await fetchDebts()
      store.setDebts(debts)
      return debts
    } catch (err) {
      store.showToast(`Failed to load debts: ${err.message}`, 'error')
    }
  }, []) // eslint-disable-line

  /**
   * Admin: register a session bill as a debt instead of collecting cash.
   * Closes session (seat freed), logs debt to customer profile.
   */
  const handleRegisterDebt = useCallback(async (sessionId) => {
    try {
      const result = await registerDebt(sessionId, store.profile?.id)
      store.removeSession(sessionId)
      await Promise.all([loadSeats(), loadDebts()])
      const amount = result?.amount ?? '?'
      store.showToast(`💸 Debt of ${amount} EGP registered. Collect next visit.`, 'info')
      return result
    } catch (err) {
      store.showToast(`Register debt failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadSeats, loadDebts]) // eslint-disable-line

  /**
   * Admin: mark a customer's outstanding debt as paid.
   */
  const handlePayDebt = useCallback(async (userId) => {
    try {
      const result = await payDebt(userId, store.profile?.id)
      await loadDebts()
      store.showToast(`✓ Debt of ${result?.paid ?? '?'} EGP collected — account cleared!`, 'ok')
      return result
    } catch (err) {
      store.showToast(`Pay debt failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadDebts]) // eslint-disable-line

  // ── Invitation Actions ────────────────────────────────

  /**
   * Admin: open a session using an invitation pass.
   * Bearer (guest or subscriber post-expiry) pays orders only; stay = free.
   * Decrements the inviter's invitations_remaining.
   */
  const handleOpenInvitationSession = useCallback(async (params) => {
    try {
      const result = await openInvitationSession(params)
      await Promise.all([loadActiveSessions(), loadSeats()])
      store.showToast(
        `✓ Invitation session opened — ${result.invitationsRemaining} invitations left`,
        'ok'
      )
      return result
    } catch (err) {
      store.showToast(`Invitation session failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadActiveSessions, loadSeats]) // eslint-disable-line

  /**
   * Fetch a subscriber's current invitation info (for the admin picker).
   */
  const getInviterInfo = useCallback(async (userId) => {
    try {
      return await fetchInviterInfo(userId)
    } catch { return null }
  }, [])

  // ── Invitation Codes ────────────────────────────────────────

  /** Customer: generate a new invite code for their active subscription. */
  const handleGenerateInviteCode = useCallback(async (inviterId, subId) => {
    try {
      const code = await generateInvitationCode(inviterId, subId)
      store.showToast('✓ Invite code generated!', 'ok')
      return code
    } catch (err) {
      store.showToast(`Failed to generate code: ${err.message}`, 'error')
      throw err
    }
  }, []) // eslint-disable-line

  /** Customer: load all invite codes they've ever generated. */
  const loadMyInviteCodes = useCallback(async (inviterId) => {
    try {
      return await fetchMyInvitationCodes(inviterId)
    } catch (err) {
      store.showToast(`Failed to load codes: ${err.message}`, 'error')
      return []
    }
  }, []) // eslint-disable-line

  /**
   * Admin: apply an invitation to an open session at checkout time.
   * Decrements the inviter's count and marks the session as subscription-based
   * so checkout calculates stay = 0.
   */
  const handleApplyInvitation = useCallback(async (sessionId, inviterId) => {
    try {
      const result = await applyInvitationToSession(sessionId, inviterId)
      store.showToast('✦ Invitation applied — stay is now free', 'ok')
      return result
    } catch (err) {
      store.showToast(`Invitation failed: ${err.message}`, 'error')
      throw err
    }
  }, []) // eslint-disable-line

  /** Admin: look up an invite code → returns inviter profile or null. */
  const lookupInviteCode = useCallback(async (code) => {
    try {
      return await lookupInvitationCode(code)
    } catch { return null }
  }, []) // eslint-disable-line

  // ── Bootstrap helpers ───────────────────────────────────────


  /** Load everything the admin dashboard needs on mount. */
  const bootstrapAdmin = useCallback(async () => {
    await Promise.all([
      loadRooms(),
      loadSeats(),
      loadActiveSessions(),
      loadPendingOrders(),
      loadDebts(),
      loadSubscriptionPlans(), // needed for ActivateModal plan list
    ])
  }, [loadRooms, loadSeats, loadActiveSessions, loadPendingOrders, loadDebts, loadSubscriptionPlans])

  /** Load everything the customer app needs on mount. */
  const bootstrapCustomer = useCallback(async (userId) => {
    await Promise.all([
      loadRooms(),
      loadSeats(),
      loadMenu(),
      loadSubscriptionPlans(),
      loadMySubscription(userId),
    ])
    const session = await loadMySession(userId)
    if (session?.id) await loadMyOrders(session.id)
  }, [loadRooms, loadSeats, loadMenu, loadMySession, loadMyOrders, loadSubscriptionPlans, loadMySubscription]) // eslint-disable-line

  return {
    // Loaders
    loadRooms,
    loadSeats,
    loadMenu,
    loadAllMenu,
    loadCustomers,
    checkCustomerSession,
    loadActiveSessions,
    loadPendingOrders,
    loadMySession,
    loadMyOrders,
    // Admin actions
    handleToggleSeat,
    getSessionBySeat,
    handleMoveSeat,
    handleOpenSession,
    handleCheckout,
    getLiveBill,
    handleUpdateOrderStatus,
    // Admin menu management (BUG-05+06)
    handleToggleMenuAvailability,
    handleAddMenuItem,
    handleEditMenuItem,
    handleDeleteMenuItem,
    // Customer actions
    handlePlaceOrder,
    // Subscriptions
    loadSubscriptionPlans,
    loadMySubscription,
    loadCustomerSubs,
    handleActivateSub,
    handleExtendSub,
    handleCancelSub,
    // Debt
    loadDebts,
    handleRegisterDebt,
    handlePayDebt,
    // Invitations
    handleOpenInvitationSession,
    getInviterInfo,
    // Invitation codes
    handleGenerateInviteCode,
    loadMyInviteCodes,
    lookupInviteCode,
    handleApplyInvitation,
    // Bootstrap
    bootstrapAdmin,
    bootstrapCustomer,
  }
}