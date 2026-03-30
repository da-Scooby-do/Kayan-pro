import React, { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'

export default function SignUpView({ onSwitch }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const { handleSignUp } = useAuth()

  const onSubmit = async (e) => {
    e.preventDefault()
    // This will create the user in Auth and the profile in your table
    await handleSignUp(email, password, fullName)
  }

  return (
    <div className="fu w-full max-w-md space-y-8 text-center relative z-10">
      <h1 className="font-display text-5xl font-bold mb-2 tracking-tighter text-kayan-gold">Create Account</h1>
      <form onSubmit={onSubmit} className="glass p-8 rounded-3xl border border-kayan-border space-y-4">
        <input 
          type="text" placeholder="Full Name" value={fullName}
          onChange={(e) => setFullName(e.target.value)}
          className="w-full bg-kayan-bg/50 border border-kayan-border-dim rounded-xl px-4 py-3 text-sm outline-none"
          required 
        />
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
          REGISTER →
        </button>
        <button type="button" onClick={onSwitch} className="text-[10px] text-kayan-muted uppercase tracking-widest pt-2">
          Already have an account? Login
        </button>
      </form>
    </div>
  )
}