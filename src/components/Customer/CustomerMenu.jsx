import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'
import { BILLING } from '@/constants'

export default function CustomerMenu() {
  const { loadMenu, handlePlaceOrder } = useKayan()

  const menu          = useKayanStore(s => s.menu)
  const cart          = useKayanStore(s => s.cart)
  const mySession     = useKayanStore(s => s.mySession)
  const addToCart     = useKayanStore(s => s.addToCart)
  const decrementCart = useKayanStore(s => s.decrementCart)
  const removeFromCart= useKayanStore(s => s.removeFromCart)

  const count = cart.reduce((s, i) => s + i.qty, 0)
  const total = cart.reduce((s, i) => s + i.price * i.qty, 0)

  const [activeCategory, setActiveCategory] = useState('hot')

  useEffect(() => { loadMenu() }, []) // eslint-disable-line

  const categories   = [...new Set(menu.map(m => m.category))]
  const filteredMenu = menu.filter(m => m.category === activeCategory)
  const hasSession   = !!mySession?.id

  // BUG-07 FIX: Reset to first available category when menu loads (avoids empty screen
  // if 'hot' category doesn't exist or has no items)
  useEffect(() => {
    if (categories.length > 0 && !categories.includes(activeCategory)) {
      setActiveCategory(categories[0])
    }
  }, [menu]) // eslint-disable-line

  const onPlaceOrder = async () => {
    if (!hasSession) return
    await handlePlaceOrder(mySession.id, cart)
  }

  return (
    <div className="p-5 animate-fade-in" style={{ paddingBottom: count > 0 ? 160 : 24 }}>

      <div className="mb-5">
        <h2 className="font-display text-2xl font-bold mb-1">Menu</h2>
        <p className="text-kayan-sub text-sm">Drinks & snacks — billed to your tab</p>
      </div>

      {/* Pricing info */}
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
              layout
              whileHover={hasSession ? { y: -3 } : {}}
              transition={{ duration: 0.15 }}
              className={`
                menu-card relative
                ${inCart ? 'in-cart' : ''}
                ${!hasSession ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              {/* Emoji */}
              <p className="text-4xl mb-2">{item.emoji}</p>

              {/* Name */}
              <p className="text-sm font-semibold mb-0.5">{item.name}</p>
              <p className="text-[11px] text-kayan-muted mb-3">{item.name_ar}</p>

              {/* Price */}
              <span className="inline-block text-sm font-bold text-kayan-gold
                               bg-kayan-gold/10 px-3 py-1 rounded-full mb-3">
                {item.price} EGP
              </span>

              {/* ── Quantity controls ─────────────────────── */}
              {inCart ? (
                <motion.div
                  key="controls"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1   }}
                  className="flex items-center justify-center gap-2 mt-1"
                  onClick={e => e.stopPropagation()} // prevent card click
                >
                  {/* Minus / Remove */}
                  <button
                    onClick={() => decrementCart(item.id)}
                    className="w-8 h-8 rounded-full flex items-center justify-center
                               text-lg font-bold leading-none
                               bg-red-500/15 border border-red-500/30 text-red-400
                               hover:bg-red-500/28 active:scale-90
                               transition-all duration-150 cursor-pointer border-solid"
                    title={inCart.qty === 1 ? 'Remove' : 'Decrease'}
                  >
                    {inCart.qty === 1 ? '×' : '−'}
                  </button>

                  {/* Quantity display */}
                  <motion.span
                    key={inCart.qty}
                    initial={{ scale: 1.4, opacity: 0 }}
                    animate={{ scale: 1,   opacity: 1 }}
                    className="w-7 text-center text-sm font-bold text-kayan-gold tabular-nums"
                  >
                    {inCart.qty}
                  </motion.span>

                  {/* Plus */}
                  <button
                    onClick={() => addToCart(item)}
                    className="w-8 h-8 rounded-full flex items-center justify-center
                               text-lg font-bold leading-none
                               bg-green-500/15 border border-green-500/30 text-green-400
                               hover:bg-green-500/28 active:scale-90
                               transition-all duration-150 cursor-pointer border-solid"
                    title="Add one more"
                  >
                    +
                  </button>
                </motion.div>
              ) : (
                /* Add to cart button — only shown when item not in cart */
                <motion.button
                  key="add"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  onClick={() => hasSession && addToCart(item)}
                  disabled={!hasSession}
                  className="text-[10px] text-kayan-gold border border-kayan-gold/30
                             px-3 py-1 rounded-full bg-kayan-gold/[0.07]
                             hover:bg-kayan-gold/15 transition-all duration-150
                             cursor-pointer disabled:cursor-not-allowed border-solid"
                >
                  + Add
                </motion.button>
              )}
            </motion.div>
          )
        })}
      </div>

      {/* ── Cart summary bar ──────────────────────────────── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            key="cart-bar"
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0,  opacity: 1 }}
            exit={{   y: 80, opacity: 0 }}
            transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-16 left-0 right-0 glass border-t border-kayan-border z-50"
          >
            {/* Cart item row */}
            <div className="px-4 pt-2.5 pb-1 flex gap-2 flex-wrap max-w-lg mx-auto">
              {cart.map(c => (
                <div key={c.id}
                     className="flex items-center gap-1 text-[10px] text-kayan-sub
                                bg-white/[0.04] rounded-full px-2 py-1">
                  <span>{c.emoji}</span>
                  <span className="font-medium text-kayan-text">×{c.qty}</span>
                  <button
                    onClick={() => removeFromCart(c.id)}
                    className="text-kayan-muted hover:text-red-400 transition-colors
                               ml-0.5 cursor-pointer bg-transparent border-none"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>

            {/* Total + order button */}
            <div className="px-4 pb-3 max-w-lg mx-auto flex items-center justify-between gap-3">
              <div>
                <span className="text-sm font-semibold">{count} item{count !== 1 ? 's' : ''}</span>
                <span className="text-kayan-gold font-bold text-sm ml-2">{total} EGP</span>
              </div>
              <button onClick={onPlaceOrder} className="btn-gold whitespace-nowrap">
                Place Order →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}