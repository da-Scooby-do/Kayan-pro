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
    const ctx  = new (window.AudioContext || window.webkitAudioContext)()
    const osc  = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.frequency.setValueAtTime(880, ctx.currentTime)
    osc.frequency.exponentialRampToValueAtTime(440, ctx.currentTime + 0.15)
    gain.gain.setValueAtTime(0.18, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.25)
    osc.start(ctx.currentTime)
    osc.stop(ctx.currentTime + 0.25)
  } catch { /* silent */ }
}

export function useAdminRealtime() {
  const { addOrder, patchOrder, patchSeat, setHasNewOrder, showToast } = useKayanStore()
  const orderChannelRef   = useRef(null)
  const seatChannelRef    = useRef(null)
  const sessionChannelRef = useRef(null)

  useEffect(() => {
    orderChannelRef.current = subscribeToOrders(
      (newOrder) => {
        addOrder(newOrder)
        setHasNewOrder(true)
        playNotificationSound()
        showToast(`🔔 New order from ${newOrder.customer_name ?? 'a customer'}`, 'info')
        setTimeout(() => setHasNewOrder(false), 8_000)
      },
      (updatedOrder) => { patchOrder(updatedOrder) }
    )
    seatChannelRef.current    = subscribeToSeats((s) => { patchSeat(s) })
    sessionChannelRef.current = subscribeToSessions(() => {}, () => {})

    return () => {
      orderChannelRef.current?.unsubscribe()
      seatChannelRef.current?.unsubscribe()
      sessionChannelRef.current?.unsubscribe()
    }
  }, []) // eslint-disable-line
}

// ── Customer session watcher ──────────────────────────────────
// Polls every 5s AND uses realtime as backup.
// Polling is the reliable fallback when realtime filters don't
// work on free-tier Supabase plans.
export function useCustomerSessionWatch(userId) {
  const { loadMySession, loadMyOrders } = useKayan()
  const { mySession, setMySession, showToast } = useKayanStore(s => ({
    mySession:  s.mySession,
    setMySession: s.setMySession,
    showToast:  s.showToast,
  }))

  const channelRef  = useRef(null)
  const pollRef     = useRef(null)
  const prevSession = useRef(null)

  useEffect(() => {
    if (!userId) return

    // ── Polling: check every 5s for a new session ─────────────
    const check = async () => {
      const session = await loadMySession(userId)

      // Session just appeared (was null, now exists)
      if (!prevSession.current && session?.id) {
        prevSession.current = session.id
        await loadMyOrders(session.id)
        showToast('✅ Your session is open! You can now order.', 'ok')
        playNotificationSound()
      }

      // Session just ended (was active, now gone)
      if (prevSession.current && !session) {
        prevSession.current = null
        showToast('👋 Your session has ended. Thanks for visiting!', 'info')
      }

      // Keep ref in sync
      if (session?.id) prevSession.current = session.id
    }

    // Run immediately, then every 5s
    check()
    pollRef.current = setInterval(check, 5000)

    // ── Realtime: faster update when it works ─────────────────
    channelRef.current = supabase
      .channel(`kayan-session-watch-${userId}`)
      .on('postgres_changes', {
        event:  '*',
        schema: 'public',
        table:  'sessions',
      }, async (payload) => {
        console.log('[Kayan] Session realtime event:', payload.eventType, payload.new)
        // Only care about this user's sessions
        const row = payload.new
        if (row?.user_id !== userId) return

        if (payload.eventType === 'INSERT' && row.status === 'active') {
          const session = await loadMySession(userId)
          if (session?.id) await loadMyOrders(session.id)
          showToast('✅ Your session is open! You can now order.', 'ok')
          playNotificationSound()
        }

        if (payload.eventType === 'UPDATE' && row.status === 'checked_out') {
          setMySession(null)
          showToast('👋 Session ended. Thanks for visiting!', 'info')
        }
      })
      .subscribe((status) => {
        console.log('[Kayan] Session channel status:', status)
      })

    return () => {
      clearInterval(pollRef.current)
      channelRef.current?.unsubscribe()
    }
  }, [userId]) // eslint-disable-line
}

// ── Customer order watcher ────────────────────────────────────
export function useCustomerRealtime(sessionId) {
  const { patchMyOrder, showToast } = useKayanStore()
  const channelRef = useRef(null)

  useEffect(() => {
    if (!sessionId) return

    channelRef.current = supabase
      .channel(`kayan-my-orders-${sessionId}`)
      .on('postgres_changes', {
        event:  'UPDATE',
        schema: 'public',
        table:  'orders',
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