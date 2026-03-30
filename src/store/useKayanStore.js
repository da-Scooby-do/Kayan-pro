// ─────────────────────────────────────────────────────────────
//  Kayan — Global State (Zustand)
//
//  This store holds the "live" runtime state that multiple
//  components read and write:
//    • Auth / profile
//    • Seats map
//    • Active sessions (admin)
//    • Order queue (admin)
//    • Customer's own session + orders
//    • Cart
//    • Toast notifications
//
//  Database interactions (fetching, mutations) live in hooks/
//  useKayan.js — they update this store after each call.
// ─────────────────────────────────────────────────────────────
import { create } from 'zustand'

const useKayanStore = create((set, get) => ({

  // ── Auth ────────────────────────────────────────────────────
  user:    null,  // Supabase auth user object
  profile: null,  // profiles table row
  authLoading: true,

  setUser:    (user)    => set({ user }),
  setProfile: (profile) => set({ profile }),
  setAuthLoading: (v)   => set({ authLoading: v }),

  // ── Rooms ───────────────────────────────────────────────────
  rooms: [],
  setRooms: (rooms) => set({ rooms }),

  // ── Seats  { [roomId]: Seat[] } ──────────────────────────────
  seats: {},
  setSeats: (seats) => set({ seats }),

  /** Patch a single seat that arrived via realtime. */
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

  /** Toggle occupancy optimistically (admin manual toggle). */
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

  // ── Admin — Active Sessions ──────────────────────────────────
  sessions: [],
  sessionsLoading: false,
  setSessionsLoading: (v) => set({ sessionsLoading: v }),
  setSessions: (sessions) => set({ sessions }),

  /** Remove a session from the list after checkout. */
  removeSession: (sessionId) => set(state => ({
    sessions: state.sessions.filter(s => s.id !== sessionId),
  })),

  // ── Admin — Order Queue ──────────────────────────────────────
  orders: [],
  ordersLoading: false,
  setOrdersLoading: (v) => set({ ordersLoading: v }),
  setOrders: (orders) => set({ orders }),

  /** Add a new order that arrived via realtime INSERT. */
  addOrder: (order) => set(state => ({
    orders: [order, ...state.orders],
  })),

  /** Patch an existing order (status change). */
  patchOrder: (updatedOrder) => set(state => ({
    orders: state.orders.map(o =>
      o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
    ),
  })),

  // ── Customer — My Session ────────────────────────────────────
  mySession:  null,
  myOrders:   [],
  myOrdersLoading: false,

  setMySession:        (s) => set({ mySession: s }),
  setMyOrders:         (o) => set({ myOrders: o }),
  setMyOrdersLoading:  (v) => set({ myOrdersLoading: v }),

  /** Append a new order to the customer's own order list. */
  addMyOrder: (order) => set(state => ({
    myOrders: [order, ...state.myOrders],
  })),

  /** Update an order status in the customer view. */
  patchMyOrder: (updatedOrder) => set(state => ({
    myOrders: state.myOrders.map(o =>
      o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o
    ),
  })),

  // ── Cart ────────────────────────────────────────────────────
  cart: [],  // [{ id, name, name_ar, price, emoji, qty }]

  addToCart: (item) => set(state => {
    const existing = state.cart.find(c => c.id === item.id)
    return existing
      ? { cart: state.cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c) }
      : { cart: [...state.cart, { ...item, qty: 1 }] }
  }),

  removeFromCart: (itemId) => set(state => ({
    cart: state.cart.filter(c => c.id !== itemId),
  })),

  clearCart: () => set({ cart: [] }),

  cartTotal:   () => get().cart.reduce((s, i) => s + i.price * i.qty, 0),
  cartCount:   () => get().cart.reduce((s, i) => s + i.qty, 0),

  // ── Customers (admin use) ────────────────────────────────────
  customers: [],
  customersLoading: false,
  setCustomers: (customers) => set({ customers }),
  setCustomersLoading: (v) => set({ customersLoading: v }),

  // ── Menu ────────────────────────────────────────────────────
  menu: [],
  setMenu: (menu) => set({ menu }),

  // ── Toast ───────────────────────────────────────────────────
  toast: null,  // { msg, type: 'ok' | 'info' | 'error' }

  showToast: (msg, type = 'ok') => {
    set({ toast: { msg, type } })
    setTimeout(() => set({ toast: null }), 3400)
  },

  // ── New-order alert (admin) ──────────────────────────────────
  hasNewOrder: false,
  setHasNewOrder: (v) => set({ hasNewOrder: v }),

}))

export default useKayanStore