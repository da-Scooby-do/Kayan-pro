import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'

// ── Single code pill ──────────────────────────────────────────
function AdminCodePill({ code, copied, onCopy }) {
  const isUsed    = code.used
  const isExpired = !code.used && new Date(code.expires_at) <= new Date()
  const isActive  = !isUsed && !isExpired

  const expiresIn = () => {
    const diff = new Date(code.expires_at) - new Date()
    if (diff <= 0) return 'Expired'
    const days  = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    if (days > 0) return `${days}d left`
    return `${hours}h left`
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 p-3 rounded-2xl border transition-all
        ${isActive
          ? 'bg-kayan-gold/[0.06] border-kayan-gold/25'
          : 'bg-white/[0.02] border-white/[0.04] opacity-50'
        }`}
    >
      <div className="flex-1 min-w-0">
        <p className={`font-mono text-lg font-bold tracking-widest
          ${isActive ? 'text-kayan-gold' : 'text-kayan-muted line-through'}`}>
          {code.code.toUpperCase()}
        </p>
        <p className="text-[9px] text-kayan-muted mt-0.5">
          {isUsed ? '✓ Used' : isExpired ? '✗ Expired' : expiresIn()}
        </p>
      </div>
      {isActive && (
        <button
          onClick={() => onCopy(code.code)}
          className="flex-shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium
                     cursor-pointer border-none transition-all
                     bg-kayan-gold/15 text-kayan-gold hover:bg-kayan-gold/25"
        >
          {copied === code.code ? '✓ Copied!' : 'Copy'}
        </button>
      )}
    </motion.div>
  )
}

// ── Main component ────────────────────────────────────────────
export default function AdminInvitations() {
  const { handleGenerateAdminCode, loadAdminCodes, loadAdminCredits } = useKayan()
  const user = useKayanStore(s => s.user)

  const [credits,    setCredits]    = useState({ total: 0, used: 0, remaining: 0 })
  const [codes,      setCodes]      = useState([])
  const [generating, setGenerating] = useState(false)
  const [loading,    setLoading]    = useState(true)
  const [copied,     setCopied]     = useState(null)

  const load = async () => {
    if (!user?.id) return
    setLoading(true)
    try {
      const [creds, list] = await Promise.all([
        loadAdminCredits(user.id),
        loadAdminCodes(user.id),
      ])
      setCredits(creds)
      setCodes(list)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [user?.id]) // eslint-disable-line

  const handleGenerate = async () => {
    if (!user?.id || credits.remaining <= 0) return
    setGenerating(true)
    try {
      const result = await handleGenerateAdminCode(user.id)
      // Refresh full list + credits
      await load()
      // Auto-copy the new code
      navigator.clipboard?.writeText(result.code.toUpperCase()).then(() => {
        setCopied(result.code)
        setTimeout(() => setCopied(null), 3000)
      })
    } catch { /* toasted inside */ } finally {
      setGenerating(false)
    }
  }

  const copyCode = (code) => {
    navigator.clipboard?.writeText(code.toUpperCase()).then(() => {
      setCopied(code)
      setTimeout(() => setCopied(null), 2000)
    })
  }

  const activeCodes = codes.filter(c => !c.used && new Date(c.expires_at) > new Date())
  const pastCodes   = codes.filter(c =>  c.used || new Date(c.expires_at) <= new Date())

  // Ring dimensions
  const R    = 32
  const CIRC = 2 * Math.PI * R
  const pct  = credits.total > 0 ? credits.remaining / credits.total : 0
  const dashOffset = CIRC * (1 - pct)
  const noCredits  = credits.remaining <= 0

  return (
    <div className="p-7 max-w-2xl animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[9px] text-kayan-muted tracking-[3px] mb-1 uppercase">Admin · Invitations</p>
        <h2 className="font-display text-3xl font-bold mb-1">Your Invites</h2>
        <p className="text-kayan-sub text-sm">
          Give friends a free session — codes are valid for 30 days
        </p>
      </div>

      {/* Credits card */}
      <div className="glass rounded-3xl border border-kayan-gold/30 p-6 mb-6 shadow-gold">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[9px] tracking-[3px] text-kayan-gold uppercase mb-2">
              Invite Credits
            </p>
            <div className="flex items-baseline gap-2 mb-1">
              <span className="font-display text-5xl font-bold text-kayan-gold">
                {loading ? '—' : credits.remaining}
              </span>
              <span className="text-kayan-muted text-sm">/ {credits.total} remaining</span>
            </div>
            <p className="text-xs text-kayan-sub">
              {loading ? '' : `${credits.used} used · ${credits.remaining} left`}
            </p>
          </div>

          {/* Animated ring */}
          <div className="relative flex-shrink-0">
            <svg width="84" height="84" style={{ transform: 'rotate(-90deg)' }}>
              <circle cx="42" cy="42" r={R} fill="none"
                stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
              <motion.circle
                cx="42" cy="42" r={R}
                fill="none"
                stroke={noCredits ? '#EF4444' : '#C9A84C'}
                strokeWidth="5"
                strokeLinecap="round"
                strokeDasharray={CIRC}
                initial={{ strokeDashoffset: CIRC }}
                animate={{ strokeDashoffset: loading ? CIRC : dashOffset }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className={`font-display text-2xl font-bold leading-none
                ${noCredits ? 'text-red-400' : 'text-kayan-gold'}`}>
                {loading ? '…' : credits.remaining}
              </span>
              <span className="text-[8px] text-kayan-muted">left</span>
            </div>
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={generating || noCredits || loading}
          className={`w-full mt-5 py-3.5 rounded-2xl text-sm font-semibold
            flex items-center justify-center gap-2 border transition-all
            disabled:opacity-40 disabled:cursor-not-allowed
            ${noCredits
              ? 'bg-white/[0.03] border-white/[0.06] text-kayan-muted'
              : 'bg-kayan-gold/15 border-kayan-gold/35 text-kayan-gold hover:bg-kayan-gold/22'
            }`}
        >
          {generating
            ? <><span className="animate-spin inline-block">◌</span> Generating…</>
            : noCredits
              ? '✕ No credits remaining'
              : <><span className="text-base">✦</span> Generate Invite Code</>
          }
        </button>

        <p className="text-[9px] text-kayan-muted text-center mt-3">
          Each code grants 1 free session · valid 30 days · single-use
        </p>
      </div>

      {/* How it works */}
      <div className="rounded-xl p-4 mb-6 bg-kayan-gold/[0.04] border border-kayan-gold/[0.14]
                      text-xs text-kayan-sub">
        <p className="text-kayan-gold font-semibold mb-2">How it works</p>
        <div className="flex flex-col gap-1.5">
          <span>✦ Generate a code and share it with your friend</span>
          <span>✦ They visit Kayan and give the code to staff at check-in</span>
          <span>✦ Staff apply it in the checkout modal — stay becomes free</span>
          <span>✦ Code is marked used · your drinks and orders are still billed</span>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="text-center py-10 text-kayan-muted text-sm animate-pulse">
          Loading codes…
        </div>
      )}

      {/* Active codes */}
      <AnimatePresence>
        {!loading && activeCodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-6"
          >
            <p className="text-[9px] text-kayan-muted uppercase tracking-widest mb-3">
              Active Codes ({activeCodes.length})
            </p>
            <div className="space-y-2">
              {activeCodes.map(c => (
                <AdminCodePill key={c.id} code={c} copied={copied} onCopy={copyCode} />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past codes */}
      {!loading && pastCodes.length > 0 && (
        <div className="mb-6">
          <p className="text-[9px] text-kayan-muted uppercase tracking-widest mb-3">
            Past Codes ({pastCodes.length})
          </p>
          <div className="space-y-2">
            {pastCodes.map(c => (
              <AdminCodePill key={c.id} code={c} copied={copied} onCopy={copyCode} />
            ))}
          </div>
        </div>
      )}

      {!loading && codes.length === 0 && (
        <div className="text-center py-10">
          <p className="text-3xl mb-3">✦</p>
          <p className="text-kayan-muted text-sm">No codes yet</p>
          <p className="text-kayan-muted text-xs mt-1">Generate one above and share it with a friend</p>
        </div>
      )}
    </div>
  )
}
