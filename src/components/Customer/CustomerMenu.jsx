import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'
import { BILLING } from '@/constants'

const CAT_EMOJI = { hot: '☕', cold: '🥤', food: '🍿', other: '✦' }

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
    <div className="animate-fade-in" style={{ paddingBottom: count > 0 ? 168 : 80 }}>

      {/* Header */}
      <div className="px-5 pt-5 pb-3">
        <h2 className="font-display text-2xl font-bold mb-0.5">Menu</h2>
        <p className="text-kayan-sub text-sm">Billed to your tab · {menu.length} items</p>
      </div>

      {/* No session warning */}
      {!hasSession && (
        <div className="mx-5 mb-3 rounded-2xl px-4 py-3 flex items-center gap-3
                        bg-amber-500/[0.08] border border-amber-500/20">
          <span className="text-xl flex-shrink-0">⚠️</span>
          <p className="text-xs text-amber-300 leading-relaxed">
            Ask staff to check you in — then you can order!
          </p>
        </div>
      )}

      {/* Category tabs — horizontally scrollable, no wrapping */}
      <div className="menu-cat-scroll">
        <div className="menu-cat-inner">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`menu-cat-btn ${activeCategory === cat ? 'active' : ''}`}
            >
              <span className="menu-cat-emoji">{CAT_EMOJI[cat] ?? '✦'}</span>
              <span className="menu-cat-label">{cat}</span>
              <span className="menu-cat-count">
                {menu.filter(m => m.category === cat).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Menu grid — 2-col, generous padding */}
      <div className="px-4 grid grid-cols-2 gap-3">
        <AnimatePresence mode="popLayout">
          {filteredMenu.map(item => {
            const inCart = cart.find(c => c.id === item.id)
            return (
              <motion.div
                key={item.id}
                layout
                initial={{ opacity: 0, scale: 0.94 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.94 }}
                transition={{ duration: 0.18 }}
                className={`menu-item-card ${inCart ? 'in-cart' : ''} ${!hasSession ? 'locked' : ''}`}
                onClick={() => hasSession && !inCart && addToCart(item)}
              >
                {/* Cart qty badge */}
                <AnimatePresence>
                  {inCart && (
                    <motion.div
                      key="badge"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="menu-badge"
                    >
                      {inCart.qty}
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Big emoji */}
                <div className="menu-item-emoji">{item.emoji || '🍽'}</div>

                {/* Name */}
                <p className="menu-item-name">{item.name}</p>
                {item.name_ar && (
                  <p className="menu-item-name-ar" dir="rtl">{item.name_ar}</p>
                )}

                {/* Price */}
                <div className="menu-item-price">{item.price} EGP</div>

                {/* Add / qty controls */}
                <div className="menu-item-controls" onClick={e => e.stopPropagation()}>
                  {inCart ? (
                    <motion.div
                      key="controls"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="menu-qty-row"
                    >
                      <button
                        className="menu-qty-btn minus"
                        onClick={() => decrementCart(item.id)}
                        aria-label="Remove one"
                      >
                        {inCart.qty === 1 ? '✕' : '−'}
                      </button>
                      <motion.span
                        key={inCart.qty}
                        initial={{ scale: 1.5, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.12 }}
                        className="menu-qty-num"
                      >
                        {inCart.qty}
                      </motion.span>
                      <button
                        className="menu-qty-btn plus"
                        onClick={() => addToCart(item)}
                        aria-label="Add one more"
                      >
                        +
                      </button>
                    </motion.div>
                  ) : (
                    <motion.button
                      key="add"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className={`menu-add-btn ${!hasSession ? 'disabled' : ''}`}
                      onClick={() => hasSession && addToCart(item)}
                      disabled={!hasSession}
                    >
                      + Add
                    </motion.button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </AnimatePresence>

        {filteredMenu.length === 0 && (
          <div className="col-span-2 text-center py-10 text-kayan-muted text-sm">
            Nothing in this category yet.
          </div>
        )}
      </div>

      {/* ── Cart bar ─────────────────────────────────────────── */}
      <AnimatePresence>
        {count > 0 && (
          <motion.div
            key="cart"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="cart-bar"
            style={{ bottom: 68 }}
          >
            {/* Item chips */}
            <div className="cart-chips">
              {cart.map(c => (
                <div key={c.id} className="cart-chip">
                  <span>{c.emoji}</span>
                  <span className="cart-chip-qty">×{c.qty}</span>
                  <button
                    onClick={() => removeFromCart(c.id)}
                    className="cart-chip-remove"
                    aria-label="Remove"
                  >×</button>
                </div>
              ))}
            </div>

            {/* Total + CTA */}
            <div className="cart-cta-row">
              <div className="cart-summary">
                <span className="cart-count">{count} item{count !== 1 ? 's' : ''}</span>
                <span className="cart-total">{total} EGP</span>
              </div>
              <button onClick={onPlaceOrder} className="btn-gold cart-order-btn">
                Order →
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
