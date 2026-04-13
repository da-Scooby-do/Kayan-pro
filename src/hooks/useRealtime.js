import { useEffect, useRef } from 'react'
import {
  subscribeToOrders,
  subscribeToSeats,
  subscribeToSessions,
  supabase,
} from '@/lib/supabase'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'

function playNotificationSound() {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.22)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.22)
  } catch { /* silent */ }
}

export function useAdminRealtime() {
  const { addOrder, patchOrder, patchSeat, setHasNewOrder, showToast } = useKayanStore()
  // BUG-13 FIX: Need loadActiveSessions to refresh session list on realtime events
  const { loadActiveSessions } = useKayan()
  const orderRef = useRef(null)
  const seatRef = useRef(null)
  const sessionRef = useRef(null)

  useEffect(() => {
    orderRef.current = subscribeToOrders(
      (newOrder) => {
        addOrder(newOrder)
        setHasNewOrder(true)
        playNotificationSound()
        showToast(`🔔 New order from ${newOrder.customer_name ?? 'a customer'}`, 'info')
        setTimeout(() => setHasNewOrder(false), 8_000)
      },
      (updatedOrder) => { patchOrder(updatedOrder) }
    )
    seatRef.current = subscribeToSeats((s) => { patchSeat(s) })
    // BUG-13 FIX: Session callbacks now reload active sessions on any INSERT or UPDATE
    sessionRef.current = subscribeToSessions(
      () => { loadActiveSessions() },
      () => { loadActiveSessions() }
    )

    return () => {
      orderRef.current?.unsubscribe()
      seatRef.current?.unsubscribe()
      sessionRef.current?.unsubscribe()
    }
  }, []) // eslint-disable-line
}

// ── Customer session watcher ─────────────────────────────────
// Polls every 15s (was 5s — reduced to cut Supabase load by 3x)
// + realtime as instant backup when it works
export function useCustomerSessionWatch(userId) {
  const { loadMySession, loadMyOrders } = useKayan()
  const mySession = useKayanStore(s => s.mySession)
  const setMySession = useKayanStore(s => s.setMySession)
  const showToast = useKayanStore(s => s.showToast)
  // BUG-22 FIX: Need clearCart so stale cart items don't persist into a new session
  const clearCart = useKayanStore(s => s.clearCart)

  const channelRef = useRef(null)
  const pollRef = useRef(null)
  const prevSession = useRef(null)
  const checkingRef = useRef(false) // prevent overlapping polls

  // BUG-18 FIX: Initialize prevSession.current from the current store state
  // so that when the component first loads with an active session,
  // the "session opened" toast doesn't fire falsely on the first poll.
  useEffect(() => {
    if (mySession?.id) prevSession.current = mySession.id
  }, []) // eslint-disable-line

  useEffect(() => {
    if (!userId) return

    const check = async () => {
      if (checkingRef.current) return // skip if already fetching
      checkingRef.current = true
      try {
        const session = await loadMySession(userId)

        if (!prevSession.current && session?.id) {
          // Transition: no session → session (genuinely new check-in)
          prevSession.current = session.id
          await loadMyOrders(session.id)
          showToast('✅ Your session is open! You can now order.', 'ok')
          playNotificationSound()
        }

        if (prevSession.current && !session) {
          // Transition: session → no session (checked out)
          prevSession.current = null
          // BUG-22 FIX: Clear stale cart items when session ends
          clearCart?.()
          showToast('👋 Your session has ended. Thanks for visiting!', 'info')
        }

        if (session?.id) prevSession.current = session.id
      } finally {
        checkingRef.current = false
      }
    }

    // Run immediately, then every 15s (not 5s)
    check()
    pollRef.current = setInterval(check, 15_000)

    // Realtime as instant backup
    channelRef.current = supabase
      .channel(`kayan-session-watch-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'sessions',
      }, async (payload) => {
        const row = payload.new
        if (row?.user_id !== userId) return

        if (payload.eventType === 'INSERT' && row.status === 'active') {
          const session = await loadMySession(userId)
          if (session?.id) {
            await loadMyOrders(session.id)
            showToast('✅ Your session is open! You can now order.', 'ok')
            playNotificationSound()
          }
        }

        if (payload.eventType === 'UPDATE' && row.status === 'checked_out') {
          setMySession(null)
          clearCart?.()  // BUG-22 FIX
          showToast('👋 Session ended. Thanks for visiting!', 'info')
        }
      })
      .subscribe()

    return () => {
      clearInterval(pollRef.current)
      channelRef.current?.unsubscribe()
    }
  }, [userId]) // eslint-disable-line
}

// ── Customer seat map watcher ────────────────────────────────
// Subscribes to seat changes so the map updates live without refresh.
// Called unconditionally in CustomerLayout (runs for every customer).
export function useCustomerSeatsRealtime() {
  const patchSeat = useKayanStore(s => s.patchSeat)
  const channelRef = useRef(null)

  useEffect(() => {
    channelRef.current = subscribeToSeats((updatedSeat) => {
      patchSeat(updatedSeat)
    })
    return () => { channelRef.current?.unsubscribe() }
  }, []) // eslint-disable-line
}

// ── Customer menu watcher ────────────────────────────────────
// Reloads the menu whenever admin adds, removes or toggles an item.
// Ensures unavailable items disappear from the customer view instantly.
export function useCustomerMenuWatch() {
  const { loadMenu } = useKayan()
  const channelRef = useRef(null)

  useEffect(() => {
    channelRef.current = supabase
      .channel('kayan-menu-watch')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'menu_items',
      }, () => {
        loadMenu()
      })
      .subscribe()

    return () => { channelRef.current?.unsubscribe() }
  }, []) // eslint-disable-line
}

// ── Customer subscription watcher ───────────────────────────
// Listens for INSERT/UPDATE on user_subscriptions for this user.
// When admin activates a subscription after the customer has already
// mounted the app, this refreshes mySubscription AND mySession so the
// bill immediately shows 0 stay cost.
export function useCustomerSubscriptionWatch(userId) {
  const { loadMySubscription, loadMySession } = useKayan()
  const channelRef = useRef(null)

  useEffect(() => {
    if (!userId) return

    channelRef.current = supabase
      .channel(`kayan-sub-watch-${userId}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'user_subscriptions',
        filter: `user_id=eq.${userId}`,
      }, async () => {
        // Refresh subscription data in store
        await loadMySubscription(userId)
        // Refresh session — it may now have is_subscription_session=true
        await loadMySession(userId)
      })
      .subscribe()

    return () => { channelRef.current?.unsubscribe() }
  }, [userId]) // eslint-disable-line
}

export function useCustomerRealtime(sessionId) {
  const { patchMyOrder, showToast } = useKayanStore()
  const channelRef = useRef(null)

  useEffect(() => {
    if (!sessionId) return

    channelRef.current = supabase
      .channel(`kayan-my-orders-${sessionId}`)
      .on('postgres_changes', {
        event: 'UPDATE', schema: 'public', table: 'orders',
        filter: `session_id=eq.${sessionId}`,
      }, (payload) => {
        patchMyOrder(payload.new)
        if (payload.new.status === 'ready') {
          showToast('✓ Your order is ready! 🎉', 'ok')
          playNotificationSound()
        }
        if (payload.new.status === 'preparing') {
          showToast('⏳ Your order is being prepared…', 'info')
        }
      })
      .subscribe()

    return () => { channelRef.current?.unsubscribe() }
  }, [sessionId]) // eslint-disable-line
}