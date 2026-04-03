import React, { useState, useEffect, lazy, Suspense } from 'react'
import { useAuth } from '@/hooks/useAuth'
import useKayanStore from '@/store/useKayanStore'
import { supabase } from '@/lib/supabase'

import LoginPage from "@/pages/LoginPage"

// 2. Lazy Load the heavy Dashboards (Code Splitting)
const AdminLayout    = lazy(() => import("@/components/Admin/AdminLayout"))
const CustomerLayout = lazy(() => import("@/components/Customer/CustomerLayout"))
const OwnerLayout    = lazy(() => import("@/components/Owner/OwnerLayout"))

function App() {
  const { user, profile, authLoading, toast } = useKayanStore()
  
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

  if (!user) return <LoginPage />

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

  // 3. Determine which layout to show based on role
  let LayoutComponent = CustomerLayout
  if (profile.role === 'owner') {
    LayoutComponent = OwnerLayout
  } else if (profile.role === 'admin' || profile.role === 'staff') {
    LayoutComponent = AdminLayout
  }

  // 4. Wrap the route in Suspense so React knows what to show while downloading the chunk
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen bg-kayan-bg flex items-center justify-center">
          <div className="animate-pulse text-kayan-gold tracking-widest text-[10px] uppercase">
            Loading Workspace...
          </div>
        </div>
      }
    >
      <LayoutComponent />
    </Suspense>
  )
}

export default App