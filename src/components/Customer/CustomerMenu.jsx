import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'
import { BILLING } from '@/constants'

export default function CustomerMenu() {
  const { loadMenu, handlePlaceOrder } = useKayan()

  // ── Individual selectors — no object destructure to prevent re-renders ──
  const menu      = useKayanStore(s => s.menu)
  const cart      = useKayanStore(s => s.cart)
  const mySession = useKayanStore(s => s.mySession)
  const addToCart = useKayanStore(s => s.addToCart)

  // Computed — derived here, NOT from store functions
  const count = cart.reduce((s, i) => s + i.qty, 0)
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const [activeCategory, setActiveCategory] = useState('hot')

  useEffect(() => { loadMenu() }, []) // eslint-disable-line

  const categories   = [...new Set(menu.map(m => m.category))]
  const filteredMenu = menu.filter(m => m.category === activeCategory)
  const hasSession   = !!mySession?.id

  const onPlaceOrder = async () => {
    if (!hasSession) return
    await handlePlaceOrder(mySession.id, cart)
  }

  return (
    <div className="p-5 animate-fade-in" style={{ paddingBottom: count > 0 ? 140 : 24 }}>

      <div className="mb-5">
        <h2 className="font-display text-2xl font-bold mb-1">Menu</h2>
        <p className="text-kayan-sub text-sm">Drinks & snacks — billed to your tab</p>
      </div>

      {/* Pricing reminder */}
      <div className="rounded-xl p-3 mb-4 bg-kayan-gold/[0.04] border border-kayan-gold/[0.14]
                      flex gap-4 text-xs text-kayan-sub flex-wrap">
        <span>⏱ <strong className="text-kayan-gold">{BILLING.HOURLY_RATE} EGP/hr</strong></span>
        <span>🏷 <strong className="text-kayan-gold">{BILLING.DAILY_CAP} EGP</strong> cap after {BILLING.CAP_HOURS}h</span>
        <span>🛒 Orders billed to your tab</span>
      </div>

      {/* No session warning */}
      {!hasSession && (
        <div className="rounded-xl p-3 mb-4 bg-amber-500/[0.07] border border-amber-500/20
                        text-xs text-amber-300">
          ⚠️ No active session yet — ask staff to check you in before ordering.
        </div>
      )}

      {/* Category tabs */}
      <div className="flex gap-2 mb-5">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`kayan-tab capitalize ${activeCategory === cat ? 'active' : ''}`}>
            {cat}
          </button>
        ))}
      </div>

      {/* Menu grid */}
      <div className="grid grid-cols-2 gap-3">
        {filteredMenu.map(item => {
          const inCart = cart.find(c => c.id === item.id)
          return (
            <motion.div
              key={item.id}
              whileHover={hasSession ? { y: -3 } : {}}
              transition={{ duration: 0.15 }}
              onClick={() => hasSession && addToCart(item)}
              className={`menu-card ${inCart ? 'in-cart' : ''} ${!hasSession ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <p className="text-4xl mb-3">{item.emoji}</p>
              <p className="text-sm font-semibold mb-0.5">{item.name}</p>
              <p className="text-[11px] text-kayan-muted mb-3">{item.name_ar}</p>
              <span className="inline-block text-sm font-bold text-kayan-gold
                               bg-kayan-gold/10 px-3 py-1 rounded-full">
                {item.price} EGP
              </span>
              {inCart && (
                <p className="text-[10px] text-green-400 mt-2">×{inCart.qty} in cart ✓</p>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* Sticky cart bar */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            key="cart-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{   y: 80, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-16 left-0 right-0 glass border-t border-kayan-border z-50 px-4 py-3"
          >
            <div className="max-w-lg mx-auto flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold">
                  {count} item{count !== 1 ? 's' : ''} in cart
                </p>
                <p className="text-[10px] text-kayan-muted mt-0.5">
                  {cart.map(c => `${c.emoji}×${c.qty}`).join(' · ')}
                </p>
              </div>
              <button onClick={onPlaceOrder} className="btn-gold whitespace-nowrap">
                Order · {total} EGP →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}