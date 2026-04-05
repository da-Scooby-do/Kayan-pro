import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

const useKayanStore = create(
  subscribeWithSelector((set, get) => ({

  // ── Auth ──────────────────────────────────────────────────
  user:        null,
  profile:     null,
  authLoading: true,

  setUser:        (user)    => set({ user }),
  setProfile:     (profile) => set({ profile }),
  setAuthLoading: (v)       => set({ authLoading: v }),

  // ── Rooms ─────────────────────────────────────────────────
  rooms: [],
  setRooms: (rooms) => set({ rooms }),

  // ── Seats { [roomId]: Seat[] } ───────────────────────────
  seats: {},
  setSeats: (seats) => set({ seats }),

  patchSeat: (updatedSeat) => set(state => {
    const roomSeats = state.seats[updatedSeat.room_id] ?? []
    return {
      seats: {
        ...state.seats,
        [updatedSeat.room_id]: roomSeats.map(s =>
          s.id === updatedSeat.id ? { ...s, ...updatedSeat } : s
        ),
      },
    }
  }),

  optimisticToggleSeat: (seatId, roomId) => set(state => {
    const roomSeats = state.seats[roomId] ?? []
    return {
      seats: {
        ...state.seats,
        [roomId]: roomSeats.map(s =>
          s.id === seatId ? { ...s, is_occupied: !s.is_occupied } : s
        ),
      },
    }
  }),

  // ── Admin — Sessions ─────────────────────────────────────
  sessions:        [],
  sessionsLoading: false,
  setSessionsLoading: (v)        => set({ sessionsLoading: v }),
  setSessions:        (sessions) => set({ sessions }),
  removeSession: (sessionId)     => set(state => ({
    sessions: state.sessions.filter(s => s.id !== sessionId),
  })),

  // ── Admin — Orders ────────────────────────────────────────
  orders:        [],
  ordersLoading: false,
  setOrdersLoading: (v)      => set({ ordersLoading: v }),
  setOrders:        (orders) => set({ orders }),

  addOrder: (order) => set(state => ({
    orders: [order, ...state.orders],
  })),

  patchOrder: (updatedOrder) => set(state => ({
    orders: state.orders.map(o =>
      o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
    ),
  })),

  // ── Customer ──────────────────────────────────────────────
  mySession:       null,
  myOrders:        [],
  myOrdersLoading: false,

  setMySession:       (s) => set({ mySession: s }),
  setMyOrders:        (o) => set({ myOrders: o }),
  setMyOrdersLoading: (v) => set({ myOrdersLoading: v }),

  addMyOrder: (order) => set(state => ({
    myOrders: [order, ...state.myOrders],
  })),

  patchMyOrder: (updatedOrder) => set(state => ({
    myOrders: state.myOrders.map(o =>
      o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
    ),
  })),

  // ── Cart ──────────────────────────────────────────────────
  // cartTotal / cartCount are COMPUTED values, not store functions
  // — derive them in components with: cart.reduce(...)
  cart: [],

  addToCart: (item) => set(state => {
    const existing = state.cart.find(c => c.id === item.id)
    return existing
      ? { cart: state.cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c) }
      : { cart: [...state.cart, { ...item, qty: 1 }] }
  }),

  removeFromCart: (itemId) => set(state => ({
    cart: state.cart.filter(c => c.id !== itemId),
  })),

  // Decrease qty by 1 — removes item entirely when qty reaches 0
  decrementCart: (itemId) => set(state => {
    const item = state.cart.find(c => c.id === itemId)
    if (!item) return {}
    if (item.qty <= 1) return { cart: state.cart.filter(c => c.id !== itemId) }
    return { cart: state.cart.map(c => c.id === itemId ? { ...c, qty: c.qty - 1 } : c) }
  }),

  clearCart: () => set({ cart: [] }),

  // ── Customers (admin picker) ──────────────────────────────
  customers:        [],
  customersLoading: false,
  setCustomers:        (customers) => set({ customers }),
  setCustomersLoading: (v)         => set({ customersLoading: v }),

  // ── Menu ──────────────────────────────────────────────────
  menu: [],
  setMenu: (menu) => set({ menu }),

  // ── Subscriptions ─────────────────────────────────────────
  mySubscription:     null,
  subscriptionPlans:  [],
  customerSubs:       [],   // admin view
  setMySubscription:    (s) => set({ mySubscription: s }),
  setSubscriptionPlans: (p) => set({ subscriptionPlans: p }),
  setCustomerSubs:      (c) => set({ customerSubs: c }),

  // ── Toast ─────────────────────────────────────────────────
  toast: null,
  _toastTimer: null,

  showToast: (msg, type = 'ok') => {
    // Clear any existing timer to prevent stacking
    const existing = get()._toastTimer
    if (existing) clearTimeout(existing)
    const timer = setTimeout(() => set({ toast: null, _toastTimer: null }), 3200)
    set({ toast: { msg, type }, _toastTimer: timer })
  },

  // ── New-order alert ───────────────────────────────────────
  hasNewOrder: false,
  setHasNewOrder: (v) => set({ hasNewOrder: v }),

  // ── Reset (called on sign out) ────────────────────────────
  // Wipes all data so no stale state bleeds between sessions
  resetStore: () => set({
    rooms: [], seats: {}, sessions: [], orders: [],
    mySession: null, myOrders: [], cart: [],
    customers: [], menu: [], toast: null,
    hasNewOrder: false, sessionsLoading: false,
    ordersLoading: false, myOrdersLoading: false,
    mySubscription: null, customerSubs: [], subscriptionPlans: [],
  }),

})))

export default useKayanStore