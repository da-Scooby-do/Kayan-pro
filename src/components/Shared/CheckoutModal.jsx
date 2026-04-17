import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'

/**
 * CheckoutModal
 * @param {Object}   session   — active_sessions_view row
 * @param {Function} onClose   — dismiss without action
 * @param {Function} onSuccess — called with the checkout result
 */
export default function CheckoutModal({ session, onClose, onSuccess }) {
  const {
    handleCheckout, getLiveBill, handleRegisterDebt,
    handleApplyInvitation, lookupInviteCode, loadCustomers,
  } = useKayan()
  const profile   = useKayanStore(s => s.profile)
  const customers = useKayanStore(s => s.customers)

  const [bill,        setBill]        = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [fetching,    setFetching]    = useState(true)

  // Manual override
  const [overrideMode,   setOverrideMode]   = useState(false)
  const [overrideInput,  setOverrideInput]  = useState('')

  // Debt flow
  const [debtConfirm, setDebtConfirm] = useState(false)
  const [debtLoading, setDebtLoading] = useState(false)
  const [debtError,   setDebtError]   = useState(null)

  // Invitation flow
  const [invConfirm,  setInvConfirm]  = useState(false)
  const [invMode,     setInvMode]     = useState('name')  // 'name' | 'code'
  const [invSearch,   setInvSearch]   = useState('')
  const [codeInput,   setCodeInput]   = useState('')
  const [codeStatus,  setCodeStatus]  = useState(null)   // null | 'looking' | 'found' | 'invalid'
  const [inviterId,   setInviterId]   = useState(null)
  const [inviterName, setInviterName] = useState('')
  const [invLoading,  setInvLoading]  = useState(false)
  const [invError,    setInvError]    = useState(null)
  const debounceRef = useRef(null)

  // Fetch live bill on mount; also reload customers for the invitation picker
  useEffect(() => {
    if (!session?.id) return
    getLiveBill(session.id).then(b => { setBill(b); setFetching(false) })
    if (!customers.length) loadCustomers()
  }, [session?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  // ── Normal checkout ──────────────────────────────────────────
  const overrideAmount = overrideMode && overrideInput !== '' ? Number(overrideInput) : null
  const effectiveTotal = overrideAmount !== null ? overrideAmount : (bill?.total_cost ?? null)

  const confirm = async () => {
    setLoading(true)
    try {
      const result = await handleCheckout(session.id, profile?.id, overrideAmount)
      onSuccess?.(result)
    } catch { /* toasted in hook */ } finally {
      setLoading(false)
    }
  }

  // ── Debt flow ────────────────────────────────────────────────
  const confirmDebt = async () => {
    setDebtLoading(true); setDebtError(null)
    try {
      const result = await handleRegisterDebt(session.id)
      onSuccess?.(result); onClose()
    } catch (err) {
      setDebtError(err?.message ?? 'Failed to register debt. Please try again.')
    } finally { setDebtLoading(false) }
  }

  // ── Invitation flow ──────────────────────────────────────────
  const resetInv = () => {
    setInvConfirm(false); setInvMode('name'); setInvSearch('')
    setCodeInput(''); setCodeStatus(null); setInviterId(null)
    setInviterName(''); setInvError(null)
  }

  // Code lookup with debounce
  const handleCodeInput = (e) => {
    const val = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)
    setCodeInput(val); setCodeStatus(null); setInviterId(null)
    clearTimeout(debounceRef.current)
    if (val.length < 6) return
    setCodeStatus('looking')
    debounceRef.current = setTimeout(async () => {
      const result = await lookupInviteCode(val.toLowerCase())
      if (!result) { setCodeStatus('invalid'); return }
      setCodeStatus('found')
      setInviterId(result.inviter.id)
      setInviterName(result.inviter.full_name ?? result.inviter.username)
    }, 500)
  }

  const confirmInvitation = async () => {
    if (!inviterId) return
    setInvLoading(true); setInvError(null)
    try {
      await handleApplyInvitation(session.id, inviterId)
      // Re-fetch bill — stay cost is now 0
      const b = await getLiveBill(session.id)
      setBill(b)
      setInvConfirm(false)
      setInviterId(null)
    } catch (err) {
      setInvError(err?.message ?? 'Failed to apply invitation.')
    } finally { setInvLoading(false) }
  }

  // Filtered customer list for name search
  const q = invSearch.trim().toLowerCase()
  const filteredInviters = invConfirm && invMode === 'name' && !inviterId && q
    ? customers
        .filter(c => c.sub_status === 'active' &&
          (c.full_name?.toLowerCase().includes(q) || c.phone?.toLowerCase().includes(q)))
        .slice(0, 6)
    : []

  // ── Bill rows ────────────────────────────────────────────────
  const isInvSession = session?.is_subscription_session || (bill && bill.stay_cost === 0 && bill.hours_stayed > 0)
  const rows = bill ? [
    { label: 'Stay duration',   value: `${bill.hours_stayed}h` },
    { label: 'Rate',            value: `${session?.package?.hourly_rate ?? 15} EGP / hr` },
    { label: 'Stay cost',       value: `${bill.stay_cost} EGP`,
      note: bill.is_capped ? 'daily cap applied' : null, noteColor: '#22C55E' },
    { label: 'Drinks & snacks', value: `${bill.orders_total} EGP` },
    { divider: true },
    { label: 'TOTAL', value: `${bill.total_cost} EGP`, bold: true, valueColor: '#C9A84C', isTotal: true },
  ] : []

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[8000] flex items-center justify-center p-5"
        style={{ background: 'rgba(7,7,14,0.88)', backdropFilter: 'blur(10px)' }}
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0,  scale: 1    }}
          exit={{   opacity: 0, y: 12,  scale: 0.97 }}
          transition={{ duration: 0.28 }}
          className="glass rounded-3xl border border-kayan-border p-8 w-full max-w-sm"
          style={{ maxHeight: '90vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="text-center mb-7">
            <div className="text-4xl mb-3">🧾</div>
            <h3 className="font-display text-2xl font-bold mb-1">Checkout</h3>
            <p className="text-kayan-sub text-sm">
              {session.customer_name} · {session.room_name}
            </p>
          </div>

          {/* Subscription / invitation badge */}
          {isInvSession && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4
                            bg-kayan-gold/[0.07] border border-kayan-gold/25">
              <span className="text-kayan-gold text-base">✦</span>
              <div>
                <p className="text-xs font-semibold text-kayan-gold">Stay Covered</p>
                <p className="text-[10px] text-kayan-muted">Subscription or invitation — orders only</p>
              </div>
            </div>
          )}

          {/* Bill rows */}
          {fetching ? (
            <div className="text-center py-8 text-kayan-muted text-sm">Calculating bill…</div>
          ) : (
            <div className="space-y-3 mb-5">
              {rows.map((r, i) =>
                r.divider ? (
                  <div key={i} className="border-t border-white/[0.05] my-1" />
                ) : r.isTotal ? (
                  /* TOTAL row with optional override */
                  <div key={i}>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-bold text-kayan-text">TOTAL</span>
                      <div className="flex items-center gap-2">
                        {overrideMode ? (
                          <div className="flex items-center gap-1">
                            <input
                              type="number"
                              min="0"
                              value={overrideInput}
                              onChange={e => setOverrideInput(e.target.value)}
                              placeholder={String(bill.total_cost)}
                              autoFocus
                              className="w-20 text-right text-lg font-bold text-kayan-gold
                                         bg-transparent border-b border-kayan-gold/50 outline-none
                                         [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
                                         [&::-webkit-inner-spin-button]:appearance-none"
                            />
                            <span className="text-sm text-kayan-gold font-bold">EGP</span>
                            <button
                              type="button"
                              onClick={() => { setOverrideMode(false); setOverrideInput('') }}
                              className="text-kayan-muted hover:text-kayan-sub text-xs ml-1
                                         bg-transparent border-none cursor-pointer"
                            >✕</button>
                          </div>
                        ) : (
                          <>
                            <span className="text-xl font-bold" style={{ color: '#C9A84C' }}>
                              {bill.total_cost} EGP
                            </span>
                            <button
                              type="button"
                              onClick={() => { setOverrideMode(true); setOverrideInput(String(bill.total_cost)) }}
                              className="text-[10px] text-kayan-muted hover:text-kayan-gold
                                         bg-transparent border-none cursor-pointer transition-colors"
                              title="Adjust amount manually"
                            >✏️</button>
                          </>
                        )}
                      </div>
                    </div>
                    {/* Override indicator */}
                    {overrideMode && overrideInput !== '' && Number(overrideInput) !== bill.total_cost && (
                      <div className="flex justify-between items-center mt-1.5 px-1">
                        <span className="text-[9px] text-kayan-muted">Original</span>
                        <span className="text-[9px] text-kayan-muted line-through">{bill.total_cost} EGP</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <div key={i} className="flex justify-between items-center">
                    <span className="text-sm text-kayan-sub">
                      {r.label}
                      {r.note && (
                        <span className="ml-2 text-[9px] font-medium" style={{ color: r.noteColor }}>
                          {r.note}
                        </span>
                      )}
                    </span>
                    <span className="text-sm font-medium text-kayan-text">{r.value}</span>
                  </div>
                )
              )}
            </div>
          )}

          {/* ── DEBT confirm panel ──────────────────────────── */}
          {debtConfirm && (
            <div className="rounded-xl bg-orange-500/[0.08] border border-orange-500/25 p-4 mb-4">
              <p className="text-xs text-orange-300 font-semibold mb-1">⚠ Register as Debt?</p>
              <p className="text-[10px] text-kayan-muted mb-4 leading-relaxed">
                {effectiveTotal ?? '—'} EGP will be added to {session.customer_name}'s
                tab. The session closes now and the amount is collected next visit.
              </p>
              {debtError && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25">
                  <p className="text-[10px] text-red-400 leading-relaxed">⚠ {debtError}</p>
                  <p className="text-[9px] text-kayan-muted mt-1">
                    Make sure the <code className="font-mono">register_debt</code> function is deployed.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setDebtConfirm(false); setDebtError(null) }}
                  className="btn-ghost flex-1 text-xs py-2" disabled={debtLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDebt} disabled={debtLoading}
                  className="flex-[2] py-2 rounded-xl text-xs font-bold text-orange-300
                             bg-orange-500/15 border border-orange-500/30
                             hover:bg-orange-500/25 transition-all cursor-pointer disabled:opacity-50"
                >
                  {debtLoading ? 'Registering…' : debtError ? '↻ Retry Debt' : `Confirm Debt — ${bill?.total_cost ?? '?'} EGP`}
                </button>
              </div>
            </div>
          )}

          {/* ── INVITATION confirm panel ────────────────────── */}
          {invConfirm && (
            <div className="rounded-xl bg-kayan-gold/[0.07] border border-kayan-gold/25 p-4 mb-4">
              <p className="text-xs text-kayan-gold font-semibold mb-1">✦ Apply Invitation Pass</p>
              <p className="text-[10px] text-kayan-muted mb-3 leading-relaxed">
                Select the subscriber whose invitation this friend is using.
                Stay cost will become <strong className="text-kayan-text">0 EGP</strong> — orders only.
              </p>

              {/* Inviter not yet selected */}
              {!inviterId ? (
                <>
                  {/* Mode tabs */}
                  <div className="flex rounded-xl overflow-hidden border border-white/[0.07] text-xs mb-3">
                    {[['name', '🔍 By name'], ['code', '✦ By code']].map(([m, label]) => (
                      <button key={m} type="button"
                        onClick={() => { setInvMode(m); setInvSearch(''); setCodeInput(''); setCodeStatus(null) }}
                        className={`flex-1 py-1.5 font-medium transition-colors cursor-pointer border-none
                          ${invMode === m ? 'bg-kayan-gold/15 text-kayan-gold' : 'bg-transparent text-kayan-muted'}`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {invMode === 'name' ? (
                    <>
                      <input
                        type="text" placeholder="Subscriber name or phone…"
                        value={invSearch} onChange={e => setInvSearch(e.target.value)}
                        className="kayan-input text-sm mb-2" autoFocus
                      />
                      <div className="space-y-1 max-h-32 overflow-y-auto">
                        {filteredInviters.map(c => (
                          <button key={c.id} type="button"
                            onClick={() => { setInviterId(c.id); setInviterName(c.full_name ?? c.username) }}
                            className="w-full flex items-center gap-2 p-2 rounded-xl cursor-pointer text-left
                                       bg-white/[0.025] border border-white/[0.05]
                                       hover:border-kayan-gold/25 hover:bg-white/[0.04] transition-all"
                          >
                            <div className="w-7 h-7 rounded-full flex items-center justify-center
                                            text-xs font-bold text-kayan-gold bg-kayan-gold/10 flex-shrink-0">
                              {(c.full_name ?? 'G')[0].toUpperCase()}
                            </div>
                            <div>
                              <p className="text-xs font-medium">{c.full_name}</p>
                              {c.phone && <p className="text-[10px] text-kayan-muted">{c.phone}</p>}
                            </div>
                            <span className="ml-auto text-[8px] font-bold text-kayan-bg bg-kayan-gold px-1.5 py-0.5 rounded-full">
                              ❆ SUB
                            </span>
                          </button>
                        ))}
                        {invMode === 'name' && q && filteredInviters.length === 0 && (
                          <p className="text-[10px] text-kayan-muted text-center py-2">No active subscribers found</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="space-y-1">
                      <div className="relative">
                        <input
                          type="text" placeholder="Enter code e.g. A3F7C2"
                          value={codeInput} onChange={handleCodeInput}
                          maxLength={8}
                          className="kayan-input text-sm font-mono tracking-widest uppercase pr-9"
                          autoFocus
                        />
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-sm">
                          {codeStatus === 'looking' && <span className="text-kayan-muted animate-pulse">…</span>}
                          {codeStatus === 'found'   && <span className="text-green-400">✓</span>}
                          {codeStatus === 'invalid' && <span className="text-red-400">✕</span>}
                        </div>
                      </div>
                      {codeStatus === 'invalid' && (
                        <p className="text-[10px] text-red-400">Code not found, already used, or expired.</p>
                      )}
                    </div>
                  )}
                </>
              ) : (
                /* Inviter resolved */
                <div className="flex items-center gap-2 p-2 rounded-xl
                                bg-kayan-gold/10 border border-kayan-gold/30 mb-3">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center
                                  text-xs font-bold text-kayan-gold bg-kayan-gold/15 flex-shrink-0">
                    {(inviterName ?? 'G')[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-kayan-gold">{inviterName}</p>
                    <p className="text-[9px] text-kayan-muted">Will use 1 invitation</p>
                  </div>
                  <button type="button" onClick={() => { setInviterId(null); setInviterName('') }}
                    className="text-[10px] text-kayan-muted cursor-pointer bg-transparent border-none">
                    ×
                  </button>
                </div>
              )}

              {invError && (
                <div className="mb-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25">
                  <p className="text-[10px] text-red-400">⚠ {invError}</p>
                </div>
              )}

              <div className="flex gap-2 mt-3">
                <button onClick={resetInv} className="btn-ghost flex-1 text-xs py-2" disabled={invLoading}>
                  Cancel
                </button>
                <button
                  onClick={confirmInvitation}
                  disabled={!inviterId || invLoading}
                  className="flex-[2] py-2 rounded-xl text-xs font-bold text-kayan-gold
                             bg-kayan-gold/15 border border-kayan-gold/35
                             hover:bg-kayan-gold/25 transition-all cursor-pointer
                             disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {invLoading ? 'Applying…' : '✦ Apply & Recalculate'}
                </button>
              </div>
            </div>
          )}

          {/* ── Normal action buttons (hidden when a panel is open) ── */}
          {!debtConfirm && !invConfirm && (
            <div className="space-y-2">
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-ghost flex-1" disabled={loading}>
                  Cancel
                </button>
                <button
                  onClick={confirm} disabled={loading || fetching}
                  className="btn-gold flex-[2] disabled:opacity-50"
                >
                  {loading ? 'Processing…' : `Confirm · ${effectiveTotal ?? '—'} EGP`}
                </button>
              </div>

              {/* Invitation option */}
              {!isInvSession && (
                <button
                  onClick={() => setInvConfirm(true)}
                  disabled={loading || fetching}
                  className="w-full py-2.5 rounded-xl text-xs font-medium text-kayan-gold/80
                             border border-kayan-gold/20 bg-kayan-gold/[0.04]
                             hover:bg-kayan-gold/10 hover:border-kayan-gold/35
                             transition-all cursor-pointer disabled:opacity-30"
                >
                  ✉️ Customer has an invitation — apply it
                </button>
              )}

              {/* Debt option */}
              <button
                onClick={() => setDebtConfirm(true)}
                disabled={loading || fetching}
                className="w-full py-2.5 rounded-xl text-xs font-medium text-orange-400/80
                           border border-orange-500/20 bg-orange-500/[0.04]
                           hover:bg-orange-500/10 hover:border-orange-500/35
                           transition-all cursor-pointer disabled:opacity-30"
              >
                💸 Can't pay now — Register as Debt
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}