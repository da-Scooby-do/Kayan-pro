import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'
import Avatar from '@/components/Shared/Avatar'

export default function AdminDebts() {
  const { loadDebts, handlePayDebt } = useKayan()
  const debts = useKayanStore(s => s.debts)

  const [payingId, setPayingId] = useState(null)   // which customer is being marked paid
  const [loading,  setLoading]  = useState(true)

  useEffect(() => {
    loadDebts().finally(() => setLoading(false))
  }, []) // eslint-disable-line

  const totalOwed = debts.reduce((s, d) => s + Number(d.outstanding_debt ?? 0), 0)

  const markPaid = async (customer) => {
    setPayingId(customer.id)
    try {
      await handlePayDebt(customer.id)
    } finally {
      setPayingId(null)
    }
  }

  return (
    <div className="p-7 max-w-3xl animate-fade-in">

      {/* Header */}
      <div className="mb-6">
        <p className="text-[9px] text-kayan-muted tracking-[3px] mb-1 uppercase">Admin · Billing</p>
        <h2 className="font-display text-3xl font-bold mb-1">Outstanding Debts</h2>
        <p className="text-kayan-sub text-sm">
          Customers who couldn't pay at checkout — collect next visit
        </p>
      </div>

      {/* Stats */}
      {debts.length > 0 && (
        <div className="grid grid-cols-2 gap-3 mb-7">
          <div className="glass rounded-2xl p-4 border border-white/[0.05]">
            <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-1.5">Customers with Debt</p>
            <p className="font-display text-2xl font-bold text-orange-400">{debts.length}</p>
            <p className="text-[10px] text-kayan-muted mt-0.5">pending collection</p>
          </div>
          <div className="glass rounded-2xl p-4 border border-white/[0.05]">
            <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-1.5">Total Outstanding</p>
            <p className="font-display text-2xl font-bold text-kayan-gold">
              {totalOwed} <span className="text-sm font-normal">EGP</span>
            </p>
            <p className="text-[10px] text-kayan-muted mt-0.5">across all customers</p>
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div className="text-center py-16 text-kayan-muted text-sm">Loading debts…</div>
      )}

      {/* Empty state */}
      {!loading && debts.length === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="glass rounded-2xl border border-kayan-border p-12 text-center"
        >
          <div className="text-5xl mb-4">✓</div>
          <p className="font-display text-xl font-semibold mb-2">All Clear!</p>
          <p className="text-kayan-sub text-sm max-w-xs mx-auto">
            No outstanding debts — all customers are up to date.
          </p>
        </motion.div>
      )}

      {/* Debt list */}
      <div className="flex flex-col gap-4">
        <AnimatePresence>
          {debts.map(customer => (
            <motion.div
              key={customer.id} layout
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.97, x: 20 }}
              className="glass rounded-2xl border border-orange-500/20 bg-orange-500/[0.03] p-5"
            >
              <div className="flex items-center justify-between flex-wrap gap-3">
                {/* Customer info */}
                <div className="flex items-center gap-3">
                  <Avatar initial={(customer.full_name ?? 'G')[0]} size={44} />
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold">{customer.full_name}</p>
                      {customer.username && (
                        <span className="text-[9px] text-kayan-muted font-mono
                                         bg-white/[0.04] px-1.5 py-0.5 rounded-md">
                          {customer.username}
                        </span>
                      )}
                    </div>
                    {customer.phone && (
                      <p className="text-[10px] text-kayan-muted mt-0.5">📱 {customer.phone}</p>
                    )}
                  </div>
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className="font-display text-2xl font-bold text-orange-400">
                    {Number(customer.outstanding_debt).toFixed(0)}
                    <span className="text-sm ml-1 font-normal">EGP</span>
                  </p>
                  <p className="text-[9px] text-kayan-muted mt-0.5">outstanding</p>
                </div>
              </div>

              {/* Action */}
              <button
                onClick={() => markPaid(customer)}
                disabled={payingId === customer.id}
                className="w-full mt-4 py-3 rounded-xl font-bold text-sm text-green-400
                           bg-gradient-to-r from-green-500/15 to-green-500/[0.06]
                           border border-green-500/25 hover:border-green-500/50
                           transition-all duration-200 cursor-pointer
                           disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {payingId === customer.id
                  ? 'Clearing…'
                  : `✓ Mark as Paid — ${Number(customer.outstanding_debt).toFixed(0)} EGP collected`}
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Info note */}
      {!loading && debts.length > 0 && (
        <p className="text-[10px] text-kayan-muted text-center mt-8">
          Clicking "Mark as Paid" clears the full outstanding amount and logs the payment.
        </p>
      )}
    </div>
  )
}
