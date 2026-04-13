import { useEffect } from 'react'
import { useAuthBoot } from '@/hooks/useAuth'
import useKayanStore from '@/store/useKayanStore'
import { supabase } from '@/lib/supabase'

import LoginPage from '@/pages/LoginPage'
import AdminLayout from '@/components/Admin/AdminLayout'
import CustomerLayout from '@/components/Customer/CustomerLayout'
import OwnerLayout from '@/components/Owner/OwnerLayout'
import Toast from '@/components/Shared/Toast'

function App() {
  // Individual selectors — never return new objects, no re-render loops
  const user        = useKayanStore(s => s.user)
  const profile     = useKayanStore(s => s.profile)
  const authLoading = useKayanStore(s => s.authLoading)

  // Boot the Supabase auth listener — once, here only
  useAuthBoot()

  // Auto sign-out if auth finished but profile never loaded.
  // Prevents an infinite spinner when the DB row is missing or unreachable.
  useEffect(() => {
    if (!authLoading && user && !profile) {
      console.warn('Kayan: profile not found after auth — signing out')
      supabase.auth.signOut()
    }
  }, [authLoading, user, profile])

  // Sync URL with auth state so the browser bar is never stuck on /login
  useEffect(() => {
    if (authLoading) return
    const target = user ? '/' : '/login'
    if (window.location.pathname !== target) {
      window.history.replaceState({}, '', target)
    }
  }, [user, authLoading])

  // 1. No user — show login page immediately (even while auth is still resolving).
  if (!user) return (
    <>
      <LoginPage />
      <Toast />
    </>
  )

  // 2. User confirmed but profile not yet loaded — brief spinner only.
  //    The effect above will sign out if this persists after auth completes.
  if (!profile) return (
    <div className="min-h-screen bg-kayan-bg flex items-center justify-center">
      <div className="animate-pulse text-kayan-gold uppercase tracking-widest text-[10px]">
        كيان ...
      </div>
    </div>
  )

  // 3. Route by role
  if (profile.role === 'owner') return <><OwnerLayout /><Toast /></>
  if (profile.role === 'admin' || profile.role === 'staff') return <><AdminLayout /><Toast /></>
  return <><CustomerLayout /><Toast /></>
}

export default App