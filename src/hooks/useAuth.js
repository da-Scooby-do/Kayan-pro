import { useEffect, useCallback } from 'react'
import { supabase, fetchProfile, signUp, signIn } from '@/lib/supabase'
import useKayanStore from '@/store/useKayanStore'

// ── Internal profile loader ───────────────────────────────────
async function loadProfileInto(authUser, setProfile) {
  if (!authUser) { setProfile(null); return }
  try {
    const profile = await fetchProfile(authUser.id)
    setProfile(profile)
  } catch {
    setProfile(null)
  }
}

// ── useAuthBoot — call ONCE at App root ───────────────────────
// Starts the Supabase auth listener and hydrates the store.
export function useAuthBoot() {
  const { setUser, setProfile, setAuthLoading } = useKayanStore()

  useEffect(() => {
    let mounted = true
    // BUG-01 FIX: Track whether the initial boot has been handled to prevent
    // double-processing when both getSession() and INITIAL_SESSION event fire.
    let booted = false

    // Safety net: if Supabase auth lock hangs (common on mobile/slow connections),
    // force-release the loading state after 8 seconds so the app never freezes.
    const hangGuard = setTimeout(() => {
      if (mounted && !booted) {
        console.warn('Kayan: auth timed out — forcing loading=false')
        setUser(null)
        setProfile(null)
        setAuthLoading(false)
      }
    }, 8000)

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted || booted) return  // skip if state-change listener already handled it
      booted = true
      clearTimeout(hangGuard)
      const authUser = session?.user ?? null
      setUser(authUser)
      loadProfileInto(authUser, setProfile).finally(() => setAuthLoading(false))
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return

        // Skip INITIAL_SESSION if getSession() already completed boot first
        if (event === 'INITIAL_SESSION' && booted) return

        booted = true
        clearTimeout(hangGuard)
        const authUser = session?.user ?? null
        setUser(authUser)
        await loadProfileInto(authUser, setProfile)
        setAuthLoading(false)
      }
    )

    return () => {
      mounted = false
      clearTimeout(hangGuard)
      subscription.unsubscribe()
    }
  }, []) // eslint-disable-line
}

// ── useAuth — call anywhere to get action functions ───────────
// No side effects — safe to call in multiple components.
export function useAuth() {
  const { showToast, resetStore, setUser, setProfile } = useKayanStore()

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

  // Instant sign out — clears store first so UI reacts immediately
  const handleSignOut = useCallback(async () => {
    resetStore()
    setUser(null)
    setProfile(null)
    supabase.auth.signOut().catch(() => { })
  }, [resetStore, setUser, setProfile])

  return { handleSignUp, handleSignIn, handleSignOut }
}
