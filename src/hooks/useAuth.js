// ─────────────────────────────────────────────────────────────
//  useAuth — Supabase Auth lifecycle hook
//  Mount this once in App.jsx; it hydrates the Zustand store
//  with the current session and subscribes to auth changes.
// ─────────────────────────────────────────────────────────────
import { useEffect } from 'react'
import { supabase, fetchProfile, signUp, signIn, signOut } from '@/lib/supabase'
import useKayanStore from '@/store/useKayanStore'

export function useAuth() {
  const { setUser, setProfile, setAuthLoading, showToast } = useKayanStore()

  // Load profile helper
const loadProfile = async (authUser) => {
  if (!authUser) { setProfile(null); return }
  try {
    const profile = await fetchProfile(authUser.id)
    setProfile(profile)
  } catch {
    // Profile row missing — set null so the app doesn't hang
    setProfile(null)
    // Sign the user out so they see the login page instead of black screen
    await supabase.auth.signOut()
  }
}

  // Bootstrap on mount
  useEffect(() => {
    let mounted = true

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!mounted) return
      const authUser = session?.user ?? null
      setUser(authUser)
      loadProfile(authUser).finally(() => setAuthLoading(false))
    })

    // Listen for login / logout / token refresh
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
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Exposed actions ─────────────────────────────────────────

  const handleSignUp = async (email, password, fullName) => {
    try {
      await signUp({ email, password, fullName })
      showToast('✓ Account created! Check your email to confirm.', 'ok')
    } catch (err) {
      showToast(`Sign up failed: ${err.message}`, 'error')
      throw err
    }
  }

  const handleSignIn = async (email, password) => {
    try {
      await signIn({ email, password })
      showToast('✓ Welcome back!', 'ok')
    } catch (err) {
      showToast(`Sign in failed: ${err.message}`, 'error')
      throw err
    }
  }

  const handleSignOut = async () => {
    await signOut()
    showToast('Signed out successfully.', 'info')
  }

  return { handleSignUp, handleSignIn, handleSignOut }
}
