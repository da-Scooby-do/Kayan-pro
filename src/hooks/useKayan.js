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

  // ── Menu ────────────────────────────────────────────────────

  const loadMenu = useCallback(async () => {
    try {
      const menu = await fetchMenu()
      store.setMenu(menu)
      return menu
    } catch (err) {
      store.showToast(`Failed to load menu: ${err.message}`, 'error')
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

  // ── Bootstrap helpers ───────────────────────────────────────


  /** Load everything the admin dashboard needs on mount. */
  const bootstrapAdmin = useCallback(async () => {
    await Promise.all([
      loadRooms(),
      loadSeats(),
      loadActiveSessions(),
      loadPendingOrders(),
    ])
  }, [loadRooms, loadSeats, loadActiveSessions, loadPendingOrders])

  /** Load everything the customer app needs on mount. */
  const bootstrapCustomer = useCallback(async (userId) => {
    await Promise.all([
      loadRooms(),
      loadSeats(),
      loadMenu(),
    ])
    const session = await loadMySession(userId)
    if (session?.id) await loadMyOrders(session.id)
  }, [loadRooms, loadSeats, loadMenu, loadMySession, loadMyOrders])

  return {
    // Loaders
    loadRooms,
    loadSeats,
    loadMenu,
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
    // Customer actions
    handlePlaceOrder,
    // Bootstrap
    bootstrapAdmin,
    bootstrapCustomer,
  }
}