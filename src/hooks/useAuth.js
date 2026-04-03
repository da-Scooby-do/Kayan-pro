import { useEffect, useCallback } from 'react'
import { supabase, fetchProfile, signUp, signIn } from '@/lib/supabase'
import useKayanStore from '@/store/useKayanStore'

export function useAuth() {
  const { setUser, setProfile, setAuthLoading, showToast, resetStore } = useKayanStore()

  const loadProfile = useCallback(async (authUser) => {
    if (!authUser) { setProfile(null); return }
    try {
      const profile = await fetchProfile(authUser.id)
      setProfile(profile)
    } catch {
      setProfile(null)
    }
  }, [setProfile])

  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const authUser = session?.user ?? null
      setUser(authUser)
      loadProfile(authUser).finally(() => setAuthLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (!mounted) return
        const authUser = session?.user ?? null
        setUser(authUser)
        await loadProfile(authUser)
        setAuthLoading(false)
      }
    )

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line

  const handleSignUp = useCallback(async (email, password, fullName, phone) => {
    try {
      await signUp({ email, password, fullName, phone })
      showToast('✓ Account created! Check your email to confirm.', 'ok')
    } catch (err) {
      showToast(`Sign up failed: ${err.message}`, 'error')
      throw err
    }
  }, [showToast])

  const handleSignIn = useCallback(async (email, password) => {
    try {
      await signIn({ email, password })
      showToast('✓ Welcome back!', 'ok')
    } catch (err) {
      showToast(`Sign in failed: ${err.message}`, 'error')
      throw err
    }
  }, [showToast])

  // ── Sign out: clear store FIRST, then Supabase ──────────────
  // This makes the exit button feel instant — UI resets immediately
  // even if the Supabase network call takes a moment.
  const handleSignOut = useCallback(async () => {
    // 1. Wipe all local state immediately → UI snaps to login screen
    resetStore()
    setUser(null)
    setProfile(null)

    // 2. Then tell Supabase (fire and forget — don't await)
    supabase.auth.signOut().catch(() => {})
  }, [resetStore, setUser, setProfile])

  return { handleSignUp, handleSignIn, handleSignOut }
}