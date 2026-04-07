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
  const user = useKayanStore(s => s.user)
  const profile = useKayanStore(s => s.profile)
  const authLoading = useKayanStore(s => s.authLoading)

  // Boot the Supabase auth listener — once, here only
  useAuthBoot()

  useEffect(() => {
    console.log('Kayan:', { role: profile?.role, loading: authLoading })
  }, [profile, authLoading])

  // Sync URL with auth state so the browser bar is never stuck on /login
  useEffect(() => {
    if (authLoading) return
    const target = user ? '/' : '/login'
    if (window.location.pathname !== target) {
      window.history.replaceState({}, '', target)
    }
  }, [user, authLoading])

  // 1. Still loading auth
  if (authLoading) return (
    <div className="min-h-screen bg-kayan-bg flex items-center justify-center">
      <div className="animate-pulse text-kayan-gold tracking-widest text-[10px] uppercase">
        كيان ...
      </div>
    </div>
  )

  // 2. Not logged in
  if (!user) return (
    <>
      <LoginPage />
      <Toast />
    </>
  )

  // 3. Logged in but profile not yet fetched
  if (!profile) return (
    <div className="min-h-screen bg-kayan-bg flex items-center justify-center flex-col gap-4">
      <div className="animate-pulse text-kayan-gold uppercase tracking-widest text-[10px]">
        Loading…
      </div>
      <button
        onClick={() => supabase.auth.signOut()}
        className="text-[9px] text-kayan-muted border border-white/10 px-4 py-2
                   rounded-lg uppercase tracking-widest hover:text-kayan-sub
                   transition-all cursor-pointer bg-transparent"
      >
        Taking too long? Sign out
      </button>
    </div>
  )

  // 4. Route by role
  if (profile.role === 'owner') return <><OwnerLayout /><Toast /></>
  if (profile.role === 'admin' || profile.role === 'staff') return <><AdminLayout /><Toast /></>
  return <><CustomerLayout /><Toast /></>
}

export default App