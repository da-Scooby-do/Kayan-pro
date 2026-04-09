import { useState } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

export default function LoginPage() {
  const { handleSignIn, handleSignUp } = useAuth()

  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const update = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const switchMode = m => { setMode(m); setError(null); setForm({ name: '', email: '', phone: '', password: '' }) }

  const validate = () => {
    if (mode === 'signup') {
      if (!form.name.trim()) return 'Please enter your full name.'
      if (!form.phone.trim()) return 'Please enter your phone number.'
      if (!/^\+?[\d\s\-()]{8,}$/.test(form.phone.trim())) return 'Please enter a valid phone number.'
    }
    return null
  }

  const submit = async e => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError(null)
    setLoading(true)
    try {
      if (mode === 'login') {
        await handleSignIn(form.email, form.password)
      } else {
        await handleSignUp(form.email, form.password, form.name, form.phone)
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const isSignup = mode === 'signup'

  // BUG-21 FIX: Forgot password state + handler
  const [forgotMode, setForgotMode] = useState(false)
  const [forgotEmail, setForgotEmail] = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)
  const [forgotError, setForgotError] = useState(null)

  const sendReset = async e => {
    e.preventDefault()
    if (!forgotEmail.trim()) { setForgotError('Please enter your email address.'); return }
    setForgotLoading(true); setForgotError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    })
    setForgotLoading(false)
    if (error) { setForgotError(error.message) }
    else { setForgotSent(true) }
  }

  // Render forgot password overlay
  if (forgotMode) {
    return (
      <div className="min-h-screen bg-kayan-bg text-kayan-text font-sans
                      flex flex-col items-center justify-center p-5 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(201,168,76,0.07) 0%, transparent 70%)' }} />

        <div className="relative z-10 w-full max-w-sm glass rounded-3xl border border-kayan-border p-6">
          <button onClick={() => { setForgotMode(false); setForgotSent(false); setForgotError(null) }}
            className="text-kayan-muted hover:text-kayan-sub text-xs mb-5 flex items-center gap-1.5
                       cursor-pointer bg-transparent border-none">
            ← Back to Sign In
          </button>

          {forgotSent ? (
            <div className="text-center py-4">
              <div className="text-4xl mb-4">📧</div>
              <h3 className="font-display text-xl font-bold mb-2">Check your email</h3>
              <p className="text-kayan-sub text-sm">
                A password reset link has been sent to <strong>{forgotEmail}</strong>.
              </p>
              <p className="text-kayan-muted text-xs mt-3">Didn't receive it? Check your spam folder.</p>
            </div>
          ) : (
            <>
              <h3 className="font-display text-2xl font-bold mb-1">Reset Password</h3>
              <p className="text-kayan-sub text-sm mb-5">Enter your email and we'll send a reset link.</p>
              <form onSubmit={sendReset} className="space-y-3">
                <input type="email" placeholder="Email address"
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)}
                  required className="kayan-input" />
                {forgotError && (
                  <p className="text-red-400 text-xs flex items-start gap-1.5">
                    <span>⚠</span>{forgotError}
                  </p>
                )}
                <button type="submit" disabled={forgotLoading} className="btn-gold w-full disabled:opacity-50">
                  {forgotLoading ? 'Sending…' : 'Send Reset Link →'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-kayan-bg text-kayan-text font-sans
                    flex flex-col items-center justify-center p-5 relative overflow-hidden">

      {/* Desktop background SVG — laptop only, not loaded on mobile */}
      <div className="absolute inset-0 pointer-events-none hidden md:block"
        style={{
          backgroundImage: 'url(/kayan-bg-desktop.svg)',
          backgroundSize: 'cover', backgroundPosition: 'center',
          opacity: 0.10,
        }} />

      {/* Gold radial glow */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse 70% 60% at 50% 40%, rgba(201,168,76,0.07) 0%, transparent 70%)' }} />

      {/* Rings */}
      {[500, 340, 200].map((sz, i) => (
        <div key={sz} className="absolute rounded-full pointer-events-none"
          style={{
            width: sz, height: sz,
            border: `1px solid rgba(201,168,76,${0.05 - i * 0.01})`,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }} />
      ))}

      {/* Logo */}
      <div className="relative z-10 text-center mb-7">
        {/* Circular logo image only */}
        <div className="flex justify-center">
          <img
            src="/kayan-logo.png"
            alt="Kayan"
            width={100} height={100}
            className="rounded-full object-cover"
            style={{
              width: 100, height: 100,
              filter: 'drop-shadow(0 0 20px rgba(201,168,76,0.35))',
            }}
          />
        </div>
      </div>

      {/* Auth card */}
      <div className="relative z-10 w-full max-w-sm glass rounded-3xl border border-kayan-border p-6">

        {/* Mode tabs */}
        <div className="flex rounded-xl overflow-hidden border border-white/[0.07] mb-6">
          {[['login', 'Sign In'], ['signup', 'Sign Up']].map(([id, label]) => (
            <button key={id} type="button"
              onClick={() => switchMode(id)}
              className="flex-1 py-2.5 text-sm font-medium transition-colors duration-200
                         cursor-pointer border-none"
              style={{
                background: mode === id ? 'rgba(201,168,76,0.15)' : 'transparent',
                color: mode === id ? '#C9A84C' : 'rgba(255,255,255,0.35)',
              }}>
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit}>

          {/* Sign up fields — CSS height transition, no framer-motion */}
          <div style={{
            overflow: 'hidden',
            maxHeight: isSignup ? '160px' : '0px',
            transition: 'max-height 0.28s ease',
          }}>
            <div className="space-y-3 mb-3">
              <input type="text" placeholder="Full name"
                value={form.name} onChange={update('name')}
                required={isSignup} className="kayan-input" />
              <div className="relative">
                <input type="tel" placeholder="Phone (e.g. 01012345678)"
                  value={form.phone} onChange={update('phone')}
                  required={isSignup} className="kayan-input pr-10" dir="ltr" />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">📱</span>
              </div>
            </div>
          </div>

          {/* Always-visible fields */}
          <div className="space-y-3 mb-4">
            <input type="email" placeholder="Email address"
              value={form.email} onChange={update('email')}
              required className="kayan-input" />
            <input type="password" placeholder="Password"
              value={form.password} onChange={update('password')}
              required minLength={6} className="kayan-input" />
          </div>

          {/* Error */}
          {error && (
            <p className="text-red-400 text-xs px-1 mb-3 flex items-start gap-1.5">
              <span>⚠</span>{error}
            </p>
          )}

          {/* Submit */}
          <button type="submit" disabled={loading}
            className="btn-gold w-full disabled:opacity-50 disabled:cursor-not-allowed
                       transition-opacity duration-150">
            {loading
              ? (isSignup ? 'Creating account…' : 'Signing in…')
              : (isSignup ? 'Create Account →' : 'Enter Kayan →')
            }
          </button>

          {/* BUG-21 FIX: Forgot password link */}
          {!isSignup && (
            <button type="button"
              onClick={() => { setForgotMode(true); setForgotEmail(form.email) }}
              className="w-full text-center text-[10px] text-kayan-muted hover:text-kayan-sub
                         mt-2 cursor-pointer bg-transparent border-none transition-colors">
              Forgot your password?
            </button>
          )}
        </form>

        {isSignup && (
          <p className="text-center text-[10px] text-kayan-muted mt-4 leading-relaxed">
            Your phone is used by staff to identify you and is never shared.
          </p>
        )}
      </div>

      <p className="mt-7 text-[9px] text-kayan-muted tracking-[4px] relative z-10">
        KAYAN © {new Date().getFullYear()} · ALL RIGHTS RESERVED
      </p>
    </div>
  )
}