/**
 * LoginPage — Mobile-first redesign
 *
 * Performance fixes vs old version:
 *  • NO backdrop-filter / blur (was the #1 lag source on mobile)
 *  • NO filter: drop-shadow on images (GPU layer thrashing)
 *  • NO ring divs (caused paint on every animation frame)
 *  • NO max-height transition (triggers layout — replaced with grid-rows trick)
 *  • All animations use transform/opacity only (compositor-only, no repaints)
 */
import { useState, useRef } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'

// One-time, offline SVG logo fallback — avoids network request lag on login
const LOGO_INLINE = '/kayan-logo.png'

export default function LoginPage() {
  const { handleSignIn, handleSignUp } = useAuth()

  const [mode, setMode]     = useState('login')
  const [form, setForm]     = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading]   = useState(false)
  const [error, setError]       = useState(null)
  const [showPass, setShowPass] = useState(false)

  // Forgot-password flow
  const [forgotMode, setForgotMode]     = useState(false)
  const [forgotEmail, setForgotEmail]   = useState('')
  const [forgotLoading, setForgotLoading] = useState(false)
  const [forgotSent, setForgotSent]     = useState(false)
  const [forgotError, setForgotError]   = useState(null)

  const emailRef = useRef(null)

  const isSignup = mode === 'signup'

  const update = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const switchMode = m => {
    setMode(m); setError(null)
    setForm({ name: '', email: '', phone: '', password: '' })
    setShowPass(false)
    setTimeout(() => emailRef.current?.focus(), 50)
  }

  const validate = () => {
    if (isSignup) {
      if (!form.name.trim()) return 'Please enter your full name.'
      if (!form.phone.trim()) return 'Please enter your phone number.'
      if (!/^\+?[\d\s\-()]{8,}$/.test(form.phone.trim())) return 'Enter a valid phone number.'
    }
    return null
  }

  const submit = async e => {
    e.preventDefault()
    const err = validate()
    if (err) { setError(err); return }
    setError(null); setLoading(true)
    try {
      if (!isSignup) await handleSignIn(form.email, form.password)
      else           await handleSignUp(form.email, form.password, form.name, form.phone)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const sendReset = async e => {
    e.preventDefault()
    if (!forgotEmail.trim()) { setForgotError('Enter your email.'); return }
    setForgotLoading(true); setForgotError(null)
    const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail.trim(), {
      redirectTo: window.location.origin + '/reset-password',
    })
    setForgotLoading(false)
    if (error) setForgotError(error.message)
    else setForgotSent(true)
  }

  /* ── Forgot password screen ─────────────────────────────── */
  if (forgotMode) {
    return (
      <Screen>
        <div className="login-card" style={{ animationDelay: '0ms' }}>
          <button
            onClick={() => { setForgotMode(false); setForgotSent(false); setForgotError(null) }}
            className="login-back-btn"
          >
            ← Back
          </button>

          {forgotSent ? (
            <div className="text-center py-6">
              <div className="login-sent-icon">📧</div>
              <h3 className="font-display text-xl font-bold mb-2 text-kayan-text">Check your inbox</h3>
              <p className="text-kayan-sub text-sm">
                Reset link sent to <strong className="text-kayan-gold">{forgotEmail}</strong>
              </p>
              <p className="text-kayan-muted text-xs mt-3">Didn't get it? Check spam.</p>
            </div>
          ) : (
            <>
              <h3 className="font-display text-2xl font-bold mb-1">Reset Password</h3>
              <p className="text-kayan-sub text-sm mb-5">We'll send a reset link to your email.</p>
              <form onSubmit={sendReset} className="space-y-3">
                <LoginInput type="email" placeholder="Email address"
                  value={forgotEmail} onChange={e => setForgotEmail(e.target.value)} />
                {forgotError && <ErrorMsg msg={forgotError} />}
                <GoldButton disabled={forgotLoading}>
                  {forgotLoading ? 'Sending…' : 'Send Reset Link →'}
                </GoldButton>
              </form>
            </>
          )}
        </div>
      </Screen>
    )
  }

  /* ── Main login/signup screen ───────────────────────────── */
  return (
    <Screen>
      {/* Logo */}
      <div className="login-logo-wrap">
        <img src={LOGO_INLINE} alt="Kayan" className="login-logo" />
        <div className="login-logo-glow" />
      </div>

      {/* Tagline */}
      <p className="login-tagline">KAYAN · ALEXANDRIA · كيان</p>

      {/* Card */}
      <div className="login-card">

        {/* Mode toggle — sliding pill indicator */}
        <div className="login-tabs">
          <div
            className="login-tab-pill"
            style={{ transform: isSignup ? 'translateX(100%)' : 'translateX(0%)' }}
          />
          {[['login','Sign In'],['signup','Sign Up']].map(([id, label]) => (
            <button key={id} type="button"
              onClick={() => switchMode(id)}
              className={`login-tab-btn ${mode === id ? 'active' : ''}`}
            >
              {label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="login-form">
          {/* Sign-up only fields — smooth grid-rows transition, no layout thrashing */}
          <div className="login-signup-fields" style={{
            gridTemplateRows: isSignup ? '1fr' : '0fr',
          }}>
            <div className="login-signup-inner">
              <LoginInput type="text" placeholder="Full name"
                value={form.name} onChange={update('name')}
                required={isSignup} autoComplete="name" />
              <LoginInput type="tel" placeholder="Phone — e.g. 010 1234 5678"
                value={form.phone} onChange={update('phone')}
                required={isSignup} dir="ltr" />
            </div>
          </div>

          {/* Always-visible fields */}
          <div className="login-fields-always">
            <LoginInput ref={emailRef} type="email" placeholder="Email address"
              value={form.email} onChange={update('email')} required autoComplete="email" />

            <div className="login-pass-wrap">
              <LoginInput
                type={showPass ? 'text' : 'password'}
                placeholder="Password"
                value={form.password} onChange={update('password')}
                required minLength={6} autoComplete={isSignup ? 'new-password' : 'current-password'}
                style={{ paddingRight: '3.5rem' }}
              />
              <button type="button" onClick={() => setShowPass(s => !s)} className="login-show-btn">
                {showPass ? 'HIDE' : 'SHOW'}
              </button>
            </div>
          </div>

          {error && <ErrorMsg msg={error} />}

          <GoldButton disabled={loading}>
            {loading
              ? (isSignup ? 'Creating…' : 'Signing in…')
              : (isSignup ? 'Create Account →' : 'Enter Kayan →')}
          </GoldButton>

          {!isSignup && (
            <button type="button"
              onClick={() => { setForgotMode(true); setForgotEmail(form.email) }}
              className="login-forgot-btn">
              Forgot your password?
            </button>
          )}
        </form>

        {isSignup && (
          <p className="login-privacy-note">
            Your phone helps staff identify you — never shared.
          </p>
        )}
      </div>

      <p className="login-footer">KAYAN © {new Date().getFullYear()} · ALL RIGHTS RESERVED</p>
    </Screen>
  )
}

/* ── Sub-components ─────────────────────────────────────── */

function Screen({ children }) {
  return (
    <div className="login-screen">
      {/* Static gradient — no separate div, painted once */}
      <div className="login-bg" />
      <div className="login-content">{children}</div>
    </div>
  )
}

const LoginInput = ({ style, ...props }) => (
  <input
    className="kayan-input login-input-style"
    style={style}
    {...props}
  />
)

function GoldButton({ children, disabled }) {
  return (
    <button type="submit" disabled={disabled}
      className="btn-gold w-full login-submit-btn disabled:opacity-50 disabled:cursor-not-allowed">
      {children}
    </button>
  )
}

function ErrorMsg({ msg }) {
  return (
    <p className="login-error">
      <span>⚠</span> {msg}
    </p>
  )
}
