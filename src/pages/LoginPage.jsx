import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '@/hooks/useAuth'

export default function LoginPage() {
  const { handleSignIn, handleSignUp } = useAuth()

  const [mode,    setMode]    = useState('login')
  const [form,    setForm]    = useState({ name: '', email: '', phone: '', password: '' })
  const [loading, setLoading] = useState(false)
  const [error,   setError]   = useState(null)

  const update = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const validate = () => {
    if (mode === 'signup') {
      if (!form.name.trim())  return 'Please enter your full name.'
      if (!form.phone.trim()) return 'Please enter your phone number.'
      // Basic phone check — at least 8 digits
      if (!/^\+?[\d\s\-()]{8,}$/.test(form.phone.trim()))
        return 'Please enter a valid phone number.'
    }
    return null
  }

  const submit = async e => {
    e.preventDefault()
    setError(null)
    const validationError = validate()
    if (validationError) { setError(validationError); return }
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

  const switchMode = (m) => {
    setMode(m)
    setError(null)
    setForm({ name: '', email: '', phone: '', password: '' })
  }

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6
                 bg-kayan-bg text-kayan-text font-sans relative overflow-hidden"
      style={{
        background: `
          radial-gradient(ellipse 60% 80% at 15% 50%, rgba(201,168,76,.055) 0%, transparent 70%),
          radial-gradient(ellipse 50% 60% at 85% 20%, rgba(99,102,241,.04) 0%, transparent 60%),
          #07070E
        `,
      }}
    >
      {/* Background grid */}
      <div className="absolute inset-0 grid-bg pointer-events-none opacity-60" />

      {/* Decorative rings */}
      {[700, 490, 280].map((sz, i) => (
        <div key={sz} className="absolute rounded-full pointer-events-none"
          style={{
            width: sz, height: sz,
            border: `1px solid rgba(201,168,76,${0.03 + i * 0.015})`,
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
          }}
        />
      ))}

      {/* Logo */}
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0  }}
        transition={{ duration: 0.55 }}
        className="text-center mb-10 relative z-10"
      >
        <p className="text-[9px] tracking-[6px] text-kayan-gold/45 mb-3 uppercase">
          Premium Workspace · Cairo
        </p>
        <h1 className="gold-text font-display leading-none mb-1"
            style={{ fontSize: 'clamp(64px, 12vw, 96px)', fontWeight: 700 }}>
          كيان
        </h1>
        <p className="text-kayan-text/40 tracking-[10px] text-sm uppercase font-light">
          K A Y A N
        </p>
        <div className="w-14 h-px bg-gradient-to-r from-transparent via-kayan-gold/50
                        to-transparent mx-auto mt-5" />
      </motion.div>

      {/* Auth card */}
      <motion.div
        key={mode}
        initial={{ opacity: 0, y: 18, scale: 0.97 }}
        animate={{ opacity: 1, y: 0,  scale: 1    }}
        transition={{ duration: 0.3 }}
        className="glass rounded-3xl border border-kayan-border p-8 w-full max-w-sm relative z-10"
      >
        {/* Mode toggle */}
        <div className="flex rounded-xl overflow-hidden border border-white/[0.07] mb-7">
          {[
            { id: 'login',  label: 'Sign In' },
            { id: 'signup', label: 'Sign Up' },
          ].map(m => (
            <button key={m.id} onClick={() => switchMode(m.id)}
              className={`flex-1 py-2 text-sm font-medium transition-all duration-200
                          cursor-pointer border-none
                ${mode === m.id
                  ? 'bg-kayan-gold/15 text-kayan-gold'
                  : 'bg-transparent text-kayan-muted hover:text-kayan-sub'
                }`}>
              {m.label}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-3">

          {/* ── Sign Up only fields ─────────────────────── */}
          <AnimatePresence>
            {mode === 'signup' && (
              <motion.div key="signup-fields"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{   opacity: 0, height: 0 }}
                transition={{ duration: 0.22 }}
                className="space-y-3 overflow-hidden"
              >
                {/* Full name */}
                <input
                  type="text"
                  placeholder="Full name"
                  value={form.name}
                  onChange={update('name')}
                  required={mode === 'signup'}
                  className="kayan-input"
                />

                {/* Phone number */}
                <div className="relative">
                  <input
                    type="tel"
                    placeholder="Phone number (e.g. 01012345678)"
                    value={form.phone}
                    onChange={update('phone')}
                    required={mode === 'signup'}
                    className="kayan-input pr-10"
                    dir="ltr"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-base
                                   pointer-events-none">
                    📱
                  </span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Shared fields ───────────────────────────── */}
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={update('email')}
            required
            className="kayan-input"
          />

          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={update('password')}
            required
            minLength={6}
            className="kayan-input"
          />

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.p key="error"
                initial={{ opacity: 0, y: -6 }}
                animate={{ opacity: 1, y: 0  }}
                exit={{ opacity: 0 }}
                className="text-red-400 text-xs px-1 flex items-start gap-1.5"
              >
                <span>⚠</span>{error}
              </motion.p>
            )}
          </AnimatePresence>

          <button type="submit" disabled={loading}
            className="btn-gold w-full mt-1 disabled:opacity-50 disabled:cursor-not-allowed">
            {loading
              ? (mode === 'login' ? 'Signing in…' : 'Creating account…')
              : (mode === 'login' ? 'Enter Kayan →' : 'Create Account →')
            }
          </button>
        </form>

        {mode === 'signup' && (
          <p className="text-center text-[10px] text-kayan-muted mt-4 leading-relaxed">
            Your phone number is used by staff to identify you
            and will never be shared.
          </p>
        )}
      </motion.div>

      <p className="mt-8 text-[9px] text-kayan-muted tracking-[4px] relative z-10">
        KAYAN © 2025 · ALL RIGHTS RESERVED
      </p>
    </div>
  )
}