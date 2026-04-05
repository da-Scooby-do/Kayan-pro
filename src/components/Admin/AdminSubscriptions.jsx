import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'
import Avatar from '@/components/Shared/Avatar'

// ── Activate subscription modal ───────────────────────────────
function ActivateModal({ customer, onClose, onDone }) {
  const { handleActivateSub, loadSubscriptionPlans } = useKayan()
  const plans   = useKayanStore(s => s.subscriptionPlans)
  const profile = useKayanStore(s => s.profile)

  const [selectedPlan, setSelectedPlan] = useState(null)
  const [notes,        setNotes]        = useState('')
  const [loading,      setLoading]      = useState(false)

  useEffect(() => { loadSubscriptionPlans() }, []) // eslint-disable-line

  const confirm = async () => {
    if (!selectedPlan) return
    setLoading(true)
    try {
      await handleActivateSub({
        userId: customer.user_id,
        planId: selectedPlan.id,
        notes:  notes || null,
      })
      onDone()
      onClose()
    } catch { /* error toasted */ }
    finally { setLoading(false) }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[8000] flex items-end sm:items-center justify-center p-0 sm:p-5"
        style={{ background: 'rgba(7,7,14,0.9)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="glass border border-kayan-border rounded-t-3xl sm:rounded-3xl
                     w-full sm:max-w-md p-6"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[8px] tracking-[3px] text-kayan-muted uppercase mb-1">
                Activate Subscription
              </p>
              <h3 className="font-display text-xl font-bold">{customer.full_name}</h3>
              {customer.username && (
                <p className="text-[10px] text-kayan-muted font-mono">{customer.username}</p>
              )}
            </div>
            <button onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.09]
                         flex items-center justify-center text-kayan-sub text-sm
                         transition-colors cursor-pointer border-none">
              ✕
            </button>
          </div>

          {/* Plan selection */}
          <p className="text-xs font-semibold text-kayan-sub tracking-wider uppercase mb-3">
            Select Plan
          </p>
          <div className="space-y-2 mb-5">
            {plans.map(plan => (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan)}
                className={`flex items-center justify-between p-4 rounded-xl border
                  cursor-pointer transition-all duration-200
                  ${selectedPlan?.id === plan.id
                    ? 'bg-kayan-gold/10 border-kayan-gold/45'
                    : 'bg-white/[0.025] border-white/[0.06] hover:border-kayan-gold/25'
                  }`}
              >
                <div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold">{plan.name_ar}</p>
                    <p className="text-xs text-kayan-muted">{plan.name}</p>
                    {plan.is_vip && (
                      <span className="text-[8px] font-bold text-kayan-bg bg-kayan-gold
                                       px-1.5 py-0.5 rounded-full">VIP</span>
                    )}
                  </div>
                  <p className="text-[10px] text-kayan-muted mt-0.5">
                    {plan.days} days · {plan.invitations} invitation{plan.invitations !== 1 ? 's' : ''}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-base font-bold text-kayan-gold">
                    {plan.price} <span className="text-xs">EGP</span>
                  </p>
                  <p className="text-[9px] text-green-400">
                    Save {plan.discount_pct}%
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Notes */}
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="kayan-input mb-5"
          />

          {/* Selected summary */}
          {selectedPlan && (
            <div className="rounded-xl p-3 bg-kayan-gold/[0.06] border border-kayan-gold/20 mb-5">
              <p className="text-xs text-kayan-sub mb-1">
                Confirm: cash payment of
              </p>
              <p className="font-display text-2xl font-bold text-kayan-gold">
                {selectedPlan.price} EGP
              </p>
              <p className="text-[10px] text-kayan-muted mt-1">
                {selectedPlan.name} · {selectedPlan.days} days · {selectedPlan.invitations} invitations
              </p>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1" disabled={loading}>
              Cancel
            </button>
            <button
              onClick={confirm}
              disabled={!selectedPlan || loading}
              className="btn-gold flex-[2] disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading ? 'Activating…' : '✓ Activate & Collect Cash'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main component ─────────────────────────────────────────────
export default function AdminSubscriptions() {
  const { loadCustomerSubs, handleCancelSub } = useKayan()
  const customerSubs = useKayanStore(s => s.customerSubs)

  const [activateTarget, setActivateTarget] = useState(null)
  const [filter, setFilter]   = useState('all')  // all | active | none
  const [search, setSearch]   = useState('')

  useEffect(() => { loadCustomerSubs() }, []) // eslint-disable-line

  const filtered = customerSubs.filter(c => {
    const q = search.trim().toLowerCase()
    const matchSearch = !q ||
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.includes(q) ||
      c.username?.toLowerCase().includes(q)

    const matchFilter =
      filter === 'all'    ? true :
      filter === 'active' ? !!c.sub_id :
      !c.sub_id

    return matchSearch && matchFilter
  })

  // Stats
  const totalActive = customerSubs.filter(c => c.sub_id).length
  const expiringSoon = customerSubs.filter(c => c.days_remaining > 0 && c.days_remaining <= 3).length
  const totalRevenue = customerSubs.filter(c => c.sub_id).reduce((s, c) => s + Number(c.paid_amount ?? 0), 0)

  return (
    <div className="p-7 max-w-3xl animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[9px] text-kayan-muted tracking-[3px] mb-1 uppercase">Admin · Subscriptions</p>
        <h2 className="font-display text-3xl font-bold mb-1">Subscriptions</h2>
        <p className="text-kayan-sub text-sm">
          Manage customer subscription plans
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        {[
          { label: 'Active Subs',    value: totalActive,   color: '#C9A84C', sub: 'customers' },
          { label: 'Expiring Soon',  value: expiringSoon,  color: '#EF4444', sub: '≤ 3 days'  },
          { label: 'Sub Revenue',    value: `${totalRevenue} EGP`, color: '#22C55E', sub: 'collected' },
        ].map(x => (
          <div key={x.label} className="glass rounded-2xl p-4 border border-white/[0.05]">
            <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-1.5">{x.label}</p>
            <p className="font-display text-xl font-bold" style={{ color: x.color }}>{x.value}</p>
            <p className="text-[10px] text-kayan-muted mt-0.5">{x.sub}</p>
          </div>
        ))}
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <input
            type="text"
            placeholder="Search by name, phone or ID…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="kayan-input pr-8"
          />
          {search && (
            <button onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-kayan-muted
                         hover:text-kayan-sub bg-transparent border-none cursor-pointer text-sm">
              ×
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {[['all','All'],['active','Active'],['none','No Sub']].map(([v,l]) => (
            <button key={v} onClick={() => setFilter(v)}
              className={`kayan-tab ${filter === v ? 'active' : ''}`}>
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Customer list */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="text-center py-12 text-kayan-muted text-sm">
              No customers found.
            </motion.div>
          )}

          {filtered.map(c => {
            const hasSub   = !!c.sub_id
            const isLow    = c.days_remaining > 0 && c.days_remaining <= 3
            const pct      = hasSub ? Math.round((c.days_remaining / c.days_total) * 100) : 0

            return (
              <motion.div key={c.user_id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl border border-white/[0.05] p-4"
              >
                <div className="flex items-center gap-3 flex-wrap">
                  <Avatar initial={(c.full_name ?? 'G')[0]} size={42} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-semibold">{c.full_name}</p>
                      {c.username && (
                        <span className="text-[9px] text-kayan-muted font-mono bg-white/[0.04]
                                         px-1.5 py-0.5 rounded-md">{c.username}</span>
                      )}
                      {c.is_vip && (
                        <span className="text-[8px] font-bold text-kayan-bg bg-kayan-gold
                                         px-1.5 py-0.5 rounded-full">VIP</span>
                      )}
                    </div>
                    {c.phone && <p className="text-[10px] text-kayan-muted">📱 {c.phone}</p>}
                  </div>

                  {/* Right: sub status */}
                  <div className="flex items-center gap-2">
                    {hasSub ? (
                      <>
                        <div className="text-right">
                          <p className="text-xs font-semibold" style={{ color: isLow ? '#EF4444' : '#C9A84C' }}>
                            {c.plan_name_ar} · {c.days_remaining}d
                          </p>
                          <p className="text-[9px] text-kayan-muted">
                            ✉ {c.invitations_remaining} inv
                          </p>
                        </div>
                        <button
                          onClick={() => setActivateTarget(c)}
                          className="text-[10px] text-kayan-gold border border-kayan-border
                                     px-2 py-1 rounded-lg hover:border-kayan-gold/40
                                     transition-colors cursor-pointer bg-transparent">
                          Renew
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => setActivateTarget(c)}
                        className="btn-gold text-xs px-3 py-1.5">
                        + Activate
                      </button>
                    )}
                  </div>
                </div>

                {/* Progress bar for active subs */}
                {hasSub && (
                  <div className="mt-3">
                    <div className="h-1.5 rounded-full bg-white/[0.05]">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${pct}%`,
                          background: isLow
                            ? 'linear-gradient(90deg,#EF4444,#F87171)'
                            : 'linear-gradient(90deg,#C9A84C,#EFC95A)',
                        }}
                      />
                    </div>
                    <p className="text-[9px] text-kayan-muted mt-1">
                      {c.days_remaining} of {c.days_total} days remaining
                      {c.end_date && ` · expires ${new Date(c.end_date).toLocaleDateString('en-EG', { month: 'short', day: 'numeric' })}`}
                    </p>
                  </div>
                )}
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>

      {/* Activate modal */}
      {activateTarget && (
        <ActivateModal
          customer={activateTarget}
          onClose={() => setActivateTarget(null)}
          onDone={() => loadCustomerSubs()}
        />
      )}
    </div>
  )
}