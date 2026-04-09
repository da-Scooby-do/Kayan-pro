// BUG-05 FIX: No longer imports supabase directly — all DB calls go through useKayan hook
// BUG-06 FIX: Added full CRUD (Add / Edit / Delete) for menu items
import { useEffect, useState, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'

const CATEGORIES = ['hot', 'cold', 'food', 'other']
const CATEGORY_LABELS = { hot: '☕ Hot', cold: '🥤 Cold', food: '🍿 Food', other: '✦ Other' }
const EMOJI_SUGGESTIONS = ['☕','🍵','🫖','🧋','🥤','🧃','🍺','🍹','🍿','🥐','🍰','🍩','🧁','✦']

const EMPTY_FORM = { name: '', name_ar: '', emoji: '', category: 'hot', price: '', sort_order: '' }

// ── Item Form Modal ───────────────────────────────────────────
function ItemFormModal({ item, onClose, onSave }) {
  const [form, setForm] = useState(item
    ? { name: item.name, name_ar: item.name_ar ?? '', emoji: item.emoji ?? '', category: item.category, price: item.price, sort_order: item.sort_order ?? '' }
    : { ...EMPTY_FORM }
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const upd = field => e => setForm(p => ({ ...p, [field]: e.target.value }))

  const submit = async e => {
    e.preventDefault()
    if (!form.name.trim()) { setError('Item name is required.'); return }
    if (!form.price || isNaN(Number(form.price)) || Number(form.price) < 0) { setError('Enter a valid price.'); return }
    setLoading(true); setError(null)
    try {
      await onSave({ ...form, price: Number(form.price), sort_order: Number(form.sort_order) || 99 })
      onClose()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[8000] flex items-end sm:items-center justify-center p-0 sm:p-5"
        style={{ background: 'rgba(7,7,14,0.9)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.25 }}
          className="glass border border-kayan-border rounded-t-3xl sm:rounded-3xl
                     w-full sm:max-w-md p-6"
          style={{ maxHeight: '92vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex items-center justify-between mb-5">
            <div>
              <p className="text-[8px] tracking-[3px] text-kayan-muted uppercase mb-1">
                {item ? 'Edit Item' : 'Add Item'}
              </p>
              <h3 className="font-display text-xl font-bold">
                {item ? `Edit: ${item.name}` : 'New Menu Item'}
              </h3>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.09]
                         flex items-center justify-center text-kayan-sub text-sm
                         transition-colors cursor-pointer border-none"
            >✕</button>
          </div>

          <form onSubmit={submit} className="space-y-3">
            {/* Emoji picker row */}
            <div>
              <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-2">Emoji</p>
              <div className="flex gap-2 flex-wrap mb-2">
                {EMOJI_SUGGESTIONS.map(em => (
                  <button key={em} type="button"
                    onClick={() => setForm(p => ({ ...p, emoji: em }))}
                    className={`w-9 h-9 rounded-lg text-lg flex items-center justify-center
                               border transition-all cursor-pointer
                               ${form.emoji === em
                                 ? 'bg-kayan-gold/20 border-kayan-gold/50'
                                 : 'bg-white/[0.03] border-white/[0.06] hover:border-kayan-gold/25'
                               }`}
                  >{em}</button>
                ))}
              </div>
              <input type="text" placeholder="Or type an emoji…"
                value={form.emoji} onChange={upd('emoji')}
                className="kayan-input text-sm" maxLength={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-1">Name (EN)</p>
                <input type="text" placeholder="Cappuccino" required
                  value={form.name} onChange={upd('name')} className="kayan-input" />
              </div>
              <div>
                <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-1">Name (AR)</p>
                <input type="text" placeholder="كابتشينو" dir="rtl"
                  value={form.name_ar} onChange={upd('name_ar')} className="kayan-input" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-1">Category</p>
                <select value={form.category} onChange={upd('category')}
                  className="kayan-input bg-transparent">
                  {CATEGORIES.map(c => (
                    <option key={c} value={c} style={{ background: '#0d0d1a' }}>
                      {CATEGORY_LABELS[c]}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-1">Price (EGP)</p>
                <input type="number" placeholder="25" min="0" step="0.5" required
                  value={form.price} onChange={upd('price')} className="kayan-input" />
              </div>
            </div>

            <div>
              <p className="text-[9px] text-kayan-muted tracking-wider uppercase mb-1">Sort Order (optional)</p>
              <input type="number" placeholder="1, 2, 3… lower = first" min="0"
                value={form.sort_order} onChange={upd('sort_order')} className="kayan-input" />
            </div>

            {error && (
              <p className="text-red-400 text-xs px-1 flex items-start gap-1.5">
                <span>⚠</span>{error}
              </p>
            )}

            <div className="flex gap-3 pt-2">
              <button type="button" onClick={onClose} className="btn-ghost flex-1" disabled={loading}>
                Cancel
              </button>
              <button type="submit" disabled={loading}
                className="btn-gold flex-[2] disabled:opacity-50">
                {loading ? 'Saving…' : item ? '✓ Save Changes' : '+ Add Item'}
              </button>
            </div>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Delete confirm modal ───────────────────────────────────────
function DeleteConfirmModal({ item, onClose, onConfirm }) {
  const [loading, setLoading] = useState(false)
  const confirm = async () => {
    setLoading(true)
    try { await onConfirm(); onClose() } finally { setLoading(false) }
  }
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-[8000] flex items-center justify-center p-5"
        style={{ background: 'rgba(7,7,14,0.9)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 16, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          className="glass border border-kayan-border rounded-3xl w-full max-w-xs p-7 text-center"
          onClick={e => e.stopPropagation()}
        >
          <div className="text-4xl mb-3">{item.emoji || '🗑'}</div>
          <h3 className="font-display text-lg font-bold mb-1">Delete Item?</h3>
          <p className="text-kayan-sub text-sm mb-5">{item.name} will be permanently removed.</p>
          <div className="flex gap-3">
            <button onClick={onClose} className="btn-ghost flex-1" disabled={loading}>Cancel</button>
            <button onClick={confirm} disabled={loading}
              className="flex-[2] py-3 rounded-xl text-sm font-bold text-red-400
                         bg-red-500/10 border border-red-500/30
                         hover:bg-red-500/20 transition-all cursor-pointer disabled:opacity-50">
              {loading ? 'Deleting…' : '✕ Delete'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}

// ── Main Component ────────────────────────────────────────────
export default function AdminMenu() {
  const {
    loadAllMenu,
    handleToggleMenuAvailability,
    handleAddMenuItem,
    handleEditMenuItem,
    handleDeleteMenuItem,
  } = useKayan()

  const [adminMenu, setAdminMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const [editTarget, setEditTarget] = useState(null)   // null = closed, 'new' = add form, item obj = edit
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [activeCategory, setActiveCategory] = useState('all')

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      const data = await loadAllMenu()
      setAdminMenu(data)
    } finally {
      setLoading(false)
    }
  }, [loadAllMenu])

  useEffect(() => { refresh() }, []) // eslint-disable-line

  const categories = ['all', ...CATEGORIES]
  const filtered = activeCategory === 'all'
    ? adminMenu
    : adminMenu.filter(m => m.category === activeCategory)

  const handleToggle = async (item) => {
    // Optimistic update
    setAdminMenu(prev => prev.map(m => m.id === item.id ? { ...m, is_available: !m.is_available } : m))
    try {
      await handleToggleMenuAvailability(item)
    } catch {
      // Revert on failure
      setAdminMenu(prev => prev.map(m => m.id === item.id ? { ...m, is_available: item.is_available } : m))
    }
  }

  const handleSaveNew = async (formData) => {
    const item = await handleAddMenuItem(formData)
    setAdminMenu(prev => [...prev, item].sort((a, b) => a.sort_order - b.sort_order))
  }

  const handleSaveEdit = async (formData) => {
    const item = await handleEditMenuItem(editTarget.id, formData)
    setAdminMenu(prev => prev.map(m => m.id === item.id ? item : m))
  }

  const handleDelete = async () => {
    await handleDeleteMenuItem(deleteTarget)
    setAdminMenu(prev => prev.filter(m => m.id !== deleteTarget.id))
  }

  return (
    <div className="p-7 max-w-3xl animate-fade-in">

      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
        <div>
          <p className="text-[9px] text-kayan-muted tracking-[3px] mb-1 uppercase">Admin · Menu</p>
          <h2 className="font-display text-3xl font-bold mb-1">Menu Management</h2>
          <p className="text-kayan-sub text-sm">
            {adminMenu.length} items · {adminMenu.filter(m => m.is_available).length} available
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={refresh}
            className="btn-ghost text-xs px-3 py-2 flex items-center gap-1.5">
            ↻ Refresh
          </button>
          <button onClick={() => setEditTarget('new')} className="btn-gold flex items-center gap-2">
            <span className="text-lg leading-none">+</span> Add Item
          </button>
        </div>
      </div>

      {/* Category filter */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {categories.map(cat => (
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`kayan-tab capitalize ${activeCategory === cat ? 'active' : ''}`}>
            {cat === 'all' ? 'All' : CATEGORY_LABELS[cat]}
            <span className={`ml-1.5 text-[9px] font-semibold
              ${activeCategory === cat ? 'text-kayan-gold' : 'text-kayan-muted'}`}>
              {cat === 'all' ? adminMenu.length : adminMenu.filter(m => m.category === cat).length}
            </span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="text-kayan-muted animate-pulse text-sm">Loading menu…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence>
            {filtered.map(item => (
              <motion.div
                key={item.id} layout
                initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.97 }}
                className={`glass p-5 rounded-2xl border transition-all duration-300 ${
                  item.is_available ? 'border-white/[0.05]' : 'border-red-500/20 bg-red-500/[0.02]'
                }`}
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="text-3xl w-12 h-12 flex items-center justify-center
                                  rounded-xl bg-white/[0.04] border border-white/[0.06] flex-shrink-0">
                    {item.emoji || '🍽️'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-bold text-sm truncate ${
                      item.is_available ? 'text-kayan-text' : 'text-kayan-muted line-through'
                    }`}>{item.name}</h3>
                    {item.name_ar && (
                      <p className="text-[10px] text-kayan-muted truncate" dir="rtl">{item.name_ar}</p>
                    )}
                    <div className="flex gap-2 mt-1 flex-wrap">
                      <span className="text-[10px] text-kayan-gold font-mono">{item.price} EGP</span>
                      <span className="text-[10px] text-kayan-sub uppercase tracking-wider">
                        {item.category}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action row */}
                <div className="flex gap-2">
                  {/* Availability toggle */}
                  <button
                    onClick={() => handleToggle(item)}
                    className={`flex-1 py-2 text-[10px] font-bold tracking-widest rounded-lg border
                               transition-all duration-200 cursor-pointer ${
                      item.is_available
                        ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                        : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                    }`}
                  >
                    {item.is_available ? 'AVAILABLE' : 'OUT OF STOCK'}
                  </button>

                  {/* Edit */}
                  <button
                    onClick={() => setEditTarget(item)}
                    className="w-9 h-9 rounded-lg text-kayan-muted hover:text-kayan-gold
                               bg-white/[0.03] border border-white/[0.05]
                               hover:border-kayan-gold/25 transition-all cursor-pointer
                               flex items-center justify-center text-sm"
                    title="Edit item"
                  >✏</button>

                  {/* Delete */}
                  <button
                    onClick={() => setDeleteTarget(item)}
                    className="w-9 h-9 rounded-lg text-kayan-muted hover:text-red-400
                               bg-white/[0.03] border border-white/[0.05]
                               hover:border-red-500/30 transition-all cursor-pointer
                               flex items-center justify-center text-sm"
                    title="Delete item"
                  >✕</button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {!loading && filtered.length === 0 && (
            <div className="col-span-2 text-center py-12 text-kayan-muted text-sm">
              No items in this category.
            </div>
          )}
        </div>
      )}

      {/* Add / Edit Modal */}
      {editTarget && (
        <ItemFormModal
          item={editTarget === 'new' ? null : editTarget}
          onClose={() => setEditTarget(null)}
          onSave={editTarget === 'new' ? handleSaveNew : handleSaveEdit}
        />
      )}

      {/* Delete Confirm Modal */}
      {deleteTarget && (
        <DeleteConfirmModal
          item={deleteTarget}
          onClose={() => setDeleteTarget(null)}
          onConfirm={handleDelete}
        />
      )}
    </div>
  )
}