import { useState, useEffect } from 'react'
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
  const { handleCheckout, getLiveBill, handleRegisterDebt } = useKayan()
  const profile = useKayanStore(s => s.profile)

  const [bill,        setBill]        = useState(null)
  const [loading,     setLoading]     = useState(false)
  const [fetching,    setFetching]    = useState(true)
  const [debtConfirm, setDebtConfirm] = useState(false)  // two-step debt confirm
  const [debtLoading, setDebtLoading] = useState(false)
  const [debtError,   setDebtError]   = useState(null)   // error msg if debt RPC failed

  // Fetch live bill from DB function on mount
  useEffect(() => {
    if (!session?.id) return
    getLiveBill(session.id).then(b => {
      setBill(b)
      setFetching(false)
    })
  }, [session?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const confirm = async () => {
    setLoading(true)
    try {
      const result = await handleCheckout(session.id, profile?.id)
      onSuccess?.(result)
    } catch {
      // error already toasted in hook
    } finally {
      setLoading(false)
    }
  }

  const confirmDebt = async () => {
    setDebtLoading(true)
    setDebtError(null)
    try {
      const result = await handleRegisterDebt(session.id)
      onSuccess?.(result)
      onClose()          // always close after success
    } catch (err) {
      // error already toasted in hook; also surface it inline
      setDebtError(err?.message ?? 'Failed to register debt. Please try again.')
    } finally {
      setDebtLoading(false)
    }
  }

  const rows = bill ? [
    { label: 'Stay duration',   value: `${bill.hours_stayed}h`            },
    { label: 'Rate',            value: '15 EGP / hr'                      },
    { label: 'Stay cost',       value: `${bill.stay_cost} EGP`,
      note: bill.is_capped ? 'daily cap applied' : null, noteColor: '#22C55E' },
    { label: 'Drinks & snacks', value: `${bill.orders_total} EGP`          },
    { divider: true },
    { label: 'TOTAL',           value: `${bill.total_cost} EGP`,
      bold: true, valueColor: '#C9A84C' },
  ] : []

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
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

          {/* Subscription badge */}
          {session?.is_subscription_session && (
            <div className="flex items-center gap-2 p-3 rounded-xl mb-4
                            bg-kayan-gold/[0.07] border border-kayan-gold/25">
              <span className="text-kayan-gold text-base">✦</span>
              <div>
                <p className="text-xs font-semibold text-kayan-gold">Subscription Active</p>
                <p className="text-[10px] text-kayan-muted">Stay is covered — orders only</p>
              </div>
            </div>
          )}

          {/* Bill rows */}
          {fetching ? (
            <div className="text-center py-8 text-kayan-muted text-sm">
              Calculating bill…
            </div>
          ) : (
            <div className="space-y-3 mb-7">
              {rows.map((r, i) =>
                r.divider ? (
                  <div key={i} className="border-t border-white/[0.05] my-1" />
                ) : (
                  <div key={i} className="flex justify-between items-center">
                    <span className={`${r.bold ? 'text-sm font-bold text-kayan-text' : 'text-sm text-kayan-sub'}`}>
                      {r.label}
                      {r.note && (
                        <span className="ml-2 text-[9px] font-medium" style={{ color: r.noteColor }}>
                          {r.note}
                        </span>
                      )}
                    </span>
                    <span
                      className={r.bold ? 'text-xl font-bold' : 'text-sm font-medium text-kayan-text'}
                      style={r.valueColor ? { color: r.valueColor } : {}}
                    >
                      {r.value}
                    </span>
                  </div>
                )
              )}
            </div>
          )}

          {/* Actions */}
          {debtConfirm ? (
            // ── Debt confirmation step ───────────────────────
            <div className="rounded-xl bg-orange-500/[0.08] border border-orange-500/25 p-4 mb-4">
              <p className="text-xs text-orange-300 font-semibold mb-1">⚠ Register as Debt?</p>
              <p className="text-[10px] text-kayan-muted mb-4 leading-relaxed">
                {bill?.total_cost ?? '—'} EGP will be added to {session.customer_name}'s
                tab. The session closes now and the amount is collected next visit.
              </p>
              {debtError && (
                <div className="mb-3 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/25">
                  <p className="text-[10px] text-red-400 leading-relaxed">⚠ {debtError}</p>
                  <p className="text-[9px] text-kayan-muted mt-1">
                    Make sure the Supabase <code className="font-mono">register_debt</code> function is deployed.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => { setDebtConfirm(false); setDebtError(null) }}
                  className="btn-ghost flex-1 text-xs py-2"
                  disabled={debtLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDebt}
                  disabled={debtLoading}
                  className="flex-[2] py-2 rounded-xl text-xs font-bold text-orange-300
                             bg-orange-500/15 border border-orange-500/30
                             hover:bg-orange-500/25 transition-all cursor-pointer
                             disabled:opacity-50"
                >
                  {debtLoading ? 'Registering…' : debtError ? '↻ Retry Debt' : `Confirm Debt — ${bill?.total_cost ?? '?'} EGP`}
                </button>
              </div>
            </div>
          ) : (
            // ── Normal action buttons ──────────────────────
            <div className="space-y-2">
              <div className="flex gap-3">
                <button onClick={onClose} className="btn-ghost flex-1" disabled={loading}>
                  Cancel
                </button>
                <button
                  onClick={confirm}
                  disabled={loading || fetching}
                  className="btn-gold flex-[2] disabled:opacity-50"
                >
                  {loading ? 'Processing…' : `Confirm · ${bill?.total_cost ?? '—'} EGP`}
                </button>
              </div>
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