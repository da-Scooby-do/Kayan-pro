import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import useKayanStore from '@/store/useKayanStore'
import { useKayan } from '@/hooks/useKayan'

// ── Stars indicator ───────────────────────────────────────────
function Stars({ count }) {
  return (
    <div className="flex gap-1">
      {Array.from({ length: count }).map((_, i) => (
        <span key={i} className="text-kayan-gold text-base leading-none">✦</span>
      ))}
    </div>
  )
}

// ── Active subscription card ──────────────────────────────────
function ActiveSubCard({ sub }) {
  const pct = Math.round((sub.days_remaining / sub.days_total) * 100)
  const isLow = sub.days_remaining <= 3

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl border border-kayan-gold/30 p-6 mb-6
                 shadow-gold"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[9px] text-kayan-gold tracking-[3px] uppercase">
              Active Plan
            </span>
            {sub.is_vip && (
              <span className="text-[9px] font-bold text-kayan-bg bg-kayan-gold
                               px-2 py-0.5 rounded-full">VIP</span>
            )}
          </div>
          <h3 className="font-display text-2xl font-bold text-kayan-gold">
            {sub.plan_name_ar}
          </h3>
          <p className="text-kayan-sub text-xs mt-0.5">{sub.plan_name}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-4xl font-bold"
             style={{ color: isLow ? '#EF4444' : '#C9A84C' }}>
            {sub.days_remaining}
          </p>
          <p className="text-[10px] text-kayan-muted">days left</p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="mb-4">
        <div className="flex justify-between text-[9px] text-kayan-muted mb-1.5">
          <span>{sub.days_remaining} days remaining</span>
          <span>{sub.days_total} total</span>
        </div>
        <div className="h-2 rounded-full bg-white/[0.06]">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
            className="h-full rounded-full transition-colors duration-300"
            style={{
              background: isLow
                ? 'linear-gradient(90deg, #EF4444, #F87171)'
                : 'linear-gradient(90deg, #C9A84C, #EFC95A)',
            }}
          />
        </div>
        {isLow && (
          <p className="text-[9px] text-red-400 mt-1">
            ⚠ Subscription ending soon — ask staff to renew
          </p>
        )}
      </div>

      {/* Details row */}
      <div className="flex gap-4 flex-wrap">
        {/* Invitations */}
        <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2
                        border border-white/[0.05]">
          <span className="text-base">✉️</span>
          <div>
            <p className="text-sm font-bold text-kayan-gold">{sub.invitations_remaining}</p>
            <p className="text-[9px] text-kayan-muted">invitations left</p>
          </div>
        </div>
        {/* Stay cost */}
        <div className="flex items-center gap-2 bg-green-500/[0.06] rounded-xl px-3 py-2
                        border border-green-500/20">
          <span className="text-base">✓</span>
          <div>
            <p className="text-sm font-bold text-green-400">FREE</p>
            <p className="text-[9px] text-kayan-muted">stay cost</p>
          </div>
        </div>
        {/* Valid until */}
        {sub.end_date && (
          <div className="flex items-center gap-2 bg-white/[0.03] rounded-xl px-3 py-2
                          border border-white/[0.05]">
            <span className="text-base">📅</span>
            <div>
              <p className="text-sm font-bold text-kayan-text">
                {new Date(sub.end_date).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })}
              </p>
              <p className="text-[9px] text-kayan-muted">valid until</p>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  )
}

// ── Single invite code pill ───────────────────────────────────
function CodePill({ code, copied, onCopy }) {
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
          : 'bg-white/[0.02] border-white/[0.04] opacity-55'
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

// ── Invite a Friend panel (shown when sub has invitations) ────
function InvitePanel({ sub }) {
  const { handleGenerateInviteCode, loadMyInviteCodes } = useKayan()
  const user = useKayanStore(s => s.user)

  const [codes,      setCodes]      = useState([])
  const [generating, setGenerating] = useState(false)
  const [copied,     setCopied]     = useState(null)

  // Load existing codes on mount
  useEffect(() => {
    if (!user?.id) return
    loadMyInviteCodes(user.id).then(data => setCodes(data ?? []))
  }, [user?.id]) // eslint-disable-line

  const handleGenerate = async () => {
    if (!sub?.sub_id || !user?.id) return
    setGenerating(true)
    try {
      const code = await handleGenerateInviteCode(user.id, sub.sub_id)
      setCodes(prev => [code, ...prev])
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

  // SVG ring
  const R    = 26
  const CIRC = 2 * Math.PI * R
  const total = sub.invitations_total ?? 1
  const left  = sub.invitations_remaining ?? 0
  const pct   = total > 0 ? left / total : 0
  const dashOffset = CIRC * (1 - pct)
  const noInvLeft  = left <= 0

  // Partition codes
  const activeCodes  = codes.filter(c => !c.used && new Date(c.expires_at) > new Date())
  const pastCodes    = codes.filter(c => c.used || new Date(c.expires_at) <= new Date())

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass rounded-3xl border border-white/[0.08] p-6 mb-6"
    >
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-[9px] tracking-[3px] text-kayan-muted uppercase mb-1">
            Invitations
          </p>
          <h4 className="font-display text-lg font-bold">Invite a Friend</h4>
        </div>

        {/* Animated countdown ring */}
        <div className="relative">
          <svg width="68" height="68" style={{ transform: 'rotate(-90deg)' }}>
            <circle cx="34" cy="34" r={R} fill="none"
              stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
            <motion.circle
              cx="34" cy="34" r={R}
              fill="none"
              stroke={noInvLeft ? '#EF4444' : '#C9A84C'}
              strokeWidth="4"
              strokeLinecap="round"
              strokeDasharray={CIRC}
              initial={{ strokeDashoffset: CIRC }}
              animate={{ strokeDashoffset: dashOffset }}
              transition={{ duration: 1, ease: 'easeOut' }}
            />
          </svg>
          {/* Counter centred over ring */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`font-display text-xl font-bold leading-none
              ${noInvLeft ? 'text-red-400' : 'text-kayan-gold'}`}>
              {left}
            </span>
            <span className="text-[8px] text-kayan-muted">left</span>
          </div>
        </div>
      </div>

      {/* Explainer */}
      <p className="text-xs text-kayan-sub mb-5 leading-relaxed">
        Generate a code and hand it to your friend.
        They show it to staff at check-in — their stay is on you.
      </p>

      {/* Generate button */}
      <button
        onClick={handleGenerate}
        disabled={generating || noInvLeft}
        className={`w-full py-3 rounded-2xl text-sm font-semibold transition-all
          flex items-center justify-center gap-2 border
          disabled:opacity-40 disabled:cursor-not-allowed
          ${noInvLeft
            ? 'bg-white/[0.03] border-white/[0.06] text-kayan-muted'
            : 'bg-kayan-gold/15 border-kayan-gold/35 text-kayan-gold hover:bg-kayan-gold/22'
          }`}
      >
        {generating
          ? <span className="animate-pulse">Generating…</span>
          : noInvLeft
            ? 'No invitations remaining'
            : <><span className="text-base">✦</span> Generate Invite Code</>
        }
      </button>

      {/* Active codes */}
      <AnimatePresence>
        {activeCodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className="mt-4 space-y-2"
          >
            <p className="text-[9px] text-kayan-muted uppercase tracking-widest mb-2">
              Active Codes
            </p>
            {activeCodes.map(c => (
              <CodePill key={c.id} code={c} copied={copied} onCopy={copyCode} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Past codes */}
      {pastCodes.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-[9px] text-kayan-muted uppercase tracking-widest mb-2">
            Past Codes
          </p>
          {pastCodes.map(c => (
            <CodePill key={c.id} code={c} copied={copied} onCopy={copyCode} />
          ))}
        </div>
      )}

      {!generating && codes.length === 0 && (
        <p className="text-center text-kayan-muted text-xs mt-4">
          No codes yet — generate one above
        </p>
      )}
    </motion.div>
  )
}

// ── Plan card — matches the luxury card aesthetic ─────────────
function PlanCard({ plan, index }) {
  const starsCount = index + 1
  const isVip = plan.is_vip

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`relative rounded-2xl p-5 border overflow-hidden
        ${isVip
          ? 'border-kayan-gold/45 bg-gradient-to-br from-kayan-gold/10 to-kayan-gold/[0.03]'
          : 'border-white/[0.07] bg-white/[0.025]'
        }`}
    >
      {/* VIP glow */}
      {isVip && (
        <div className="absolute inset-0 bg-gradient-to-br from-kayan-gold/[0.06] to-transparent pointer-events-none" />
      )}

      {/* Top: stars + plan period */}
      <div className="flex items-start justify-between mb-3">
        <Stars count={starsCount} />
        {isVip && (
          <span className="text-[9px] font-bold tracking-wider text-kayan-bg
                           bg-kayan-gold px-2 py-0.5 rounded-full">VIP</span>
        )}
      </div>

      {/* Period label */}
      <p className="font-display text-xl font-bold mb-0.5">
        {plan.name_ar}
      </p>
      <p className="text-xs text-kayan-muted mb-4">{plan.name}</p>

      {/* Pricing */}
      <div className="mb-4">
        {/* Original price strikethrough */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] text-kayan-muted">قبل</span>
          <span className="text-sm text-kayan-muted line-through">
            {plan.original_price} جنيه
          </span>
        </div>
        {/* Separator */}
        <div className="h-px bg-kayan-gold/20 mb-2" />
        {/* New price */}
        <div className="flex items-baseline gap-2">
          <span className="text-xs text-kayan-sub">بعد</span>
          <span className="font-display text-3xl font-bold text-kayan-gold">
            {plan.price}
          </span>
          <span className="text-sm text-kayan-sub font-medium">جنيه</span>
        </div>
        {/* Savings */}
        <p className="text-[10px] text-kayan-muted mt-1">
          خصم {plan.discount_pct}٪ — وفر {plan.savings_amount} جنيه
        </p>
      </div>

      {/* Invitations badge */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex flex-col items-center px-3 py-1.5 rounded-xl
                        bg-kayan-gold/10 border border-kayan-gold/20">
          <span className="font-bold text-kayan-gold text-lg leading-none">
            {plan.invitations}
          </span>
          <span className="text-[9px] text-kayan-muted">دعوة</span>
        </div>

        {/* BUG-08 FIX: plan.features column doesn't exist — use hardcoded benefit text */}
        <div className="flex-1">
          <p className="text-[10px] text-kayan-sub flex items-center gap-1">
            <span className="text-kayan-gold text-[8px]">❆</span>Stay covered every visit
          </p>
          <p className="text-[10px] text-kayan-sub flex items-center gap-1">
            <span className="text-kayan-gold text-[8px]">❆</span>Orders billed separately
          </p>
          {isVip && (
            <p className="text-[10px] text-kayan-sub flex items-center gap-1">
              <span className="text-kayan-gold text-[8px]">❆</span>VIP priority seating
            </p>
          )}
        </div>
      </div>

      {/* CTA */}
      <div className={`text-center py-2 rounded-xl text-xs font-semibold
        ${isVip
          ? 'bg-kayan-gold/15 border border-kayan-gold/35 text-kayan-gold'
          : 'bg-white/[0.04] border border-white/[0.07] text-kayan-sub'
        }`}>
        Ask staff to activate →
      </div>
    </motion.div>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function CustomerSubscription() {
  const mySubscription   = useKayanStore(s => s.mySubscription)
  const subscriptionPlans = useKayanStore(s => s.subscriptionPlans)

  return (
    <div className="p-5 pb-24 animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold mb-1">Subscription</h2>
        <p className="text-kayan-sub text-sm">
          Subscribe and your stay is always covered
        </p>
      </div>

      {/* Active subscription (if any) */}
      {mySubscription ? (
        <>
          <ActiveSubCard sub={mySubscription} />
          {/* Invite panel — only when there are invitations included */}
          {(mySubscription.invitations_total ?? 0) > 0 && (
            <InvitePanel sub={mySubscription} />
          )}
        </>
      ) : (
        <div className="glass rounded-2xl border border-white/[0.05] p-5 mb-6 text-center">
          <p className="text-2xl mb-2">✦</p>
          <p className="text-kayan-sub text-sm">No active subscription</p>
          <p className="text-kayan-muted text-xs mt-1">
            Choose a plan below and ask staff to activate it
          </p>
        </div>
      )}

      {/* How subscriptions work */}
      <div className="rounded-xl p-3 mb-6 bg-kayan-gold/[0.04] border border-kayan-gold/[0.14]
                      text-xs text-kayan-sub">
        <p className="text-kayan-gold font-semibold mb-1.5">How it works</p>
        <div className="flex flex-col gap-1">
          <span>✦ Pay once — your stay is covered every visit</span>
          <span>✦ Only drinks & snacks are billed per visit</span>
          <span>✦ Each day you check in uses 1 subscription day</span>
          <span>✦ Invite friends with your included invitations</span>
        </div>
      </div>

      {/* Available plans */}
      <div className="mb-4">
        <h3 className="font-display text-lg font-semibold mb-1">Available Plans</h3>
        <p className="text-kayan-muted text-xs mb-4">
          Visit reception to activate — pay cash to staff
        </p>

        {subscriptionPlans.length === 0 ? (
          <div className="text-center py-8 text-kayan-muted text-sm">
            Loading plans…
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {subscriptionPlans.map((plan, i) => (
              <PlanCard key={plan.id} plan={plan} index={i} />
            ))}
          </div>
        )}
      </div>

    </div>
  )
}