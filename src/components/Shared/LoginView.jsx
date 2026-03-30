import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function LoginView({ onSwitch }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const { handleSignIn } = useAuth()

  const onSubmit = async (e) => {
    e.preventDefault()
    await handleSignIn(email, password)
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-kayan-bg">
      <div className="fu w-full max-w-md space-y-8 text-center">
        <h1 className="font-display text-7xl font-bold mb-2 tracking-tighter text-kayan-gold">كيان</h1>
        <form onSubmit={onSubmit} className="glass p-8 rounded-3xl border border-kayan-border space-y-4">
          <input 
            type="email" placeholder="Email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full bg-kayan-bg/50 border border-kayan-border-dim rounded-xl px-4 py-3 text-sm outline-none"
            required 
          />
          <input 
            type="password" placeholder="Password" value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full bg-kayan-bg/50 border border-kayan-border-dim rounded-xl px-4 py-3 text-sm outline-none"
            required 
          />
          <button type="submit" className="w-full py-4 bg-kayan-gold text-kayan-bg font-bold rounded-xl text-xs tracking-widest uppercase">
            LOGIN →
          </button>
          <button type="button" onClick={onSwitch} className="text-[10px] text-kayan-muted uppercase tracking-widest pt-2">
            Don't have an account? Sign Up
          </button>
        </form>
      </div>
    </div>
  )
}