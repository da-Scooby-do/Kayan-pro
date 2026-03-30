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
  const { handleCheckout, getLiveBill } = useKayan()
  const profile = useKayanStore(s => s.profile)

  const [bill,     setBill]     = useState(null)
  const [loading,  setLoading]  = useState(false)
  const [fetching, setFetching] = useState(true)

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
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="btn-ghost flex-1"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              onClick={confirm}
              disabled={loading || fetching}
              className="btn-gold flex-[2] disabled:opacity-50"
            >
              {loading
                ? 'Processing…'
                : `Confirm · ${bill?.total_cost ?? '—'} EGP`}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
