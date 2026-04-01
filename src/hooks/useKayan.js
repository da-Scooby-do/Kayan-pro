// ─────────────────────────────────────────────────────────────
//  useKayan — Master database-interaction hook
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
  }, [store])

  const loadSeats = useCallback(async () => {
    try {
      const seats = await fetchAllSeats()
      store.setSeats(seats)
      return seats
    } catch (err) {
      store.showToast(`Failed to load seats: ${err.message}`, 'error')
    }
  }, [store])

  const handleToggleSeat = useCallback(async (seatId, roomId, currentlyOccupied) => {
    store.optimisticToggleSeat(seatId, roomId)
    try {
      await toggleSeatOccupancy(seatId, !currentlyOccupied)
    } catch (err) {
      store.optimisticToggleSeat(seatId, roomId) // Rollback
      store.showToast(`Toggle failed: ${err.message}`, 'error')
    }
  }, [store])

  // ── Menu ────────────────────────────────────────────────────

  const loadMenu = useCallback(async () => {
    try {
      const menu = await fetchMenu()
      store.setMenu(menu)
      return menu
    } catch (err) {
      store.showToast(`Failed to load menu: ${err.message}`, 'error')
    }
  }, [store])

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
  }, [store])

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
  }, [store])

  const handleOpenSession = useCallback(async (params) => {
    try {
      const session = await openSession(params)
      await Promise.all([loadActiveSessions(), loadSeats()])
      store.showToast(`✓ Session opened for seat ${params.seatId}`, 'ok')
      return session
    } catch (err) {
      store.showToast(`Open session failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadActiveSessions, loadSeats, store])

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
  }, [loadSeats, store])

  const getLiveBill = useCallback(async (sessionId) => {
    try {
      return await getSessionCost(sessionId)
    } catch (err) {
      store.showToast(`Bill calculation failed: ${err.message}`, 'error')
      return null
    }
  }, [store])

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
  }, [store])

  const handleUpdateOrderStatus = useCallback(async (orderId, newStatus) => {
    try {
      const updated = await updateOrderStatus(orderId, newStatus)
      store.patchOrder(updated)
      const labels = { 
        preparing: '⏳ Preparing…', 
        ready: '✓ Order ready — customer notified.', 
        delivered: '✓ Delivered.' 
      }
      store.showToast(labels[newStatus] ?? 'Order updated.', 'ok')
      return updated
    } catch (err) {
      store.showToast(`Update failed: ${err.message}`, 'error')
      throw err
    }
  }, [store])

  // ── Customer: Remote Persistence ────────────────────────────

  const loadMySession = useCallback(async (userId) => {
    if (!userId) return null
    try {
      // "True Memory": Reaching into Supabase to find their active session
      const session = await fetchMyActiveSession(userId)
      store.setMySession(session)
      return session
    } catch (err) {
      // We don't toast here usually because new users won't have a session
      return null
    }
  }, [store])

  const loadMyOrders = useCallback(async (sessionId) => {
    if (!sessionId) return
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
  }, [store])

  const handlePlaceOrder = useCallback(async (sessionId, cart) => {
    if (!cart.length || !sessionId) return
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
  }, [store])

  // ── Admin: Move seat ────────────────────────────────────────

  const getSessionBySeat = useCallback(async (seatId) => {
    try {
      return await fetchSessionBySeat(seatId)
    } catch (err) {
      store.showToast(`Could not load seat info: ${err.message}`, 'error')
      return null
    }
  }, [store])

  const handleMoveSeat = useCallback(async (sessionId, newSeatId) => {
    try {
      await moveSessionSeat(sessionId, newSeatId, store.profile?.id)
      await loadSeats()
      store.showToast('✓ Seat changed successfully.', 'ok')
    } catch (err) {
      store.showToast(`Move failed: ${err.message}`, 'error')
      throw err
    }
  }, [loadSeats, store])

  // ── Bootstrap Helpers ───────────────────────────────────────

  /** Load everything the admin dashboard needs on mount. */
  const bootstrapAdmin = useCallback(async () => {
    await Promise.all([
      loadRooms(),
      loadSeats(),
      loadActiveSessions(),
      loadPendingOrders(),
    ])
  }, [loadRooms, loadSeats, loadActiveSessions, loadPendingOrders])

  /** * THE TRUE MEMORY BOOTSTRAP
   * This is the "Engine" that makes your persistence work.
   */
  const bootstrapCustomer = useCallback(async (userId) => {
    if (!userId) return

    // 1. Fetch static data (Rooms/Seats/Menu)
    await Promise.all([
      loadRooms(),
      loadSeats(),
      loadMenu(),
    ])

    // 2. Sync their Cloud State (Remote Persistence)
    const session = await loadMySession(userId)
    
    // 3. If they are currently sitting in a seat, fetch their tab
    if (session?.id) {
      await loadMyOrders(session.id)
    }
  }, [loadRooms, loadSeats, loadMenu, loadMySession, loadMyOrders])

  return {
    loadRooms,
    loadSeats,
    loadMenu,
    loadCustomers,
    checkCustomerSession,
    loadActiveSessions,
    loadPendingOrders,
    loadMySession,
    loadMyOrders,
    handleToggleSeat,
    getSessionBySeat,
    handleMoveSeat,
    handleOpenSession,
    handleCheckout,
    getLiveBill,
    handleUpdateOrderStatus,
    handlePlaceOrder,
    bootstrapAdmin,
    bootstrapCustomer,
  }
}