import React, { useState, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import useKayanStore from '@/store/useKayanStore'
import { supabase } from '@/lib/supabase'

import LoginView     from "@/components/Shared/LoginView"
import SignUpView    from "@/components/Shared/SignUpView"
import AdminLayout   from "@/components/Admin/AdminLayout"
import CustomerLayout from "@/components/Customer/CustomerLayout"
import OwnerLayout   from "@/components/Owner/OwnerLayout"

function App() {
  const { user, profile, authLoading, toast } = useKayanStore()
  const [isSignUp, setIsSignUp] = useState(false)
  const { handleSignOut } = useAuth()

  useEffect(() => {
    console.log("Kayan System Status:", {
      email: user?.email, role: profile?.role, loading: authLoading,
    })
  }, [user, profile, authLoading])

  if (authLoading) return (
    <div className="min-h-screen bg-kayan-bg flex items-center justify-center">
      <div className="animate-pulse text-kayan-gold tracking-widest text-[10px] uppercase">
        كيان ...
      </div>
    </div>
  )

  if (!user) return (
    <div className="min-h-screen bg-kayan-bg">
      {isSignUp
        ? <SignUpView onSwitch={() => setIsSignUp(false)} />
        : <LoginView  onSwitch={() => setIsSignUp(true)}  />
      }
      {toast && (
        <div className="fixed top-4 right-4 glass px-6 py-3 border border-kayan-border
                        rounded-xl z-[9999] text-xs">
          {toast.msg}
        </div>
      )}
    </div>
  )

  if (!profile) return (
    <div className="min-h-screen bg-kayan-bg flex items-center justify-center flex-col gap-4">
      <div className="animate-pulse text-kayan-gold uppercase tracking-widest text-[10px]">
        Fetching Profile...
      </div>
      <button onClick={() => supabase.auth.signOut()}
        className="text-[9px] text-kayan-muted border border-white/10 px-4 py-2
                   rounded-lg uppercase tracking-widest hover:text-kayan-sub
                   transition-all cursor-pointer bg-transparent">
        Taking too long? Sign out
      </button>
    </div>
  )

  // Route by role
  if (profile.role === 'owner')                          return <OwnerLayout />
  if (profile.role === 'admin' || profile.role === 'staff') return <AdminLayout />
  return <CustomerLayout />
}

export default App