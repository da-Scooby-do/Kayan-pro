import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import useKayanStore from '@/store/useKayanStore'

export default function AdminMenu() {
  const [adminMenu, setAdminMenu] = useState([])
  const [loading, setLoading] = useState(true)
  const showToast = useKayanStore(s => s.showToast)

  // 1. Fetch ALL items (ignoring if they are out of stock)
  const loadAdminMenu = async () => {
    setLoading(true)
    const { data, error } = await supabase
      .from('menu_items')
      .select('*')
      .order('category')
      .order('sort_order')

    if (!error && data) {
      setAdminMenu(data)
    } else {
      showToast('Failed to load menu items', 'error')
    }
    setLoading(false)
  }

  useEffect(() => {
    loadAdminMenu()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // 2. The Toggle Logic
  const handleToggle = async (item) => {
    const newStatus = !item.is_available
    
    // Optimistic UI Update (feels instant to the admin)
    setAdminMenu(prev => 
      prev.map(m => m.id === item.id ? { ...m, is_available: newStatus } : m)
    )

    // Save to Database
    const { error } = await supabase
      .from('menu_items')
      .update({ is_available: newStatus })
      .eq('id', item.id)

    if (error) {
      showToast(`Failed to update ${item.name}`, 'error')
      loadAdminMenu() // Revert if it fails
    } else {
      showToast(`${item.name} is now ${newStatus ? 'Available' : 'Out of Stock'}`, 'ok')
    }
  }

  return (
    <div className="p-8 animate-fade-in max-w-4xl mx-auto pb-24">
      <div className="mb-8">
        <h2 className="font-display text-3xl font-bold mb-2 text-kayan-gold">Menu Management</h2>
        <p className="text-kayan-sub text-sm">Turn items on or off to hide them from the customer app.</p>
      </div>

      {loading ? (
        <div className="text-kayan-muted animate-pulse">Loading menu database...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {adminMenu.map((item) => (
            <motion.div 
              key={item.id}
              layout
              className={`glass p-5 rounded-2xl border transition-all duration-300 flex items-center justify-between ${
                item.is_available ? 'border-white/[0.05]' : 'border-red-500/20 bg-red-500/[0.02]'
              }`}
            >
              {/* Item Info */}
              <div className="flex items-center gap-4">
                <div className="text-3xl">{item.emoji || '🍽️'}</div>
                <div>
                  <h3 className={`font-bold text-sm ${item.is_available ? 'text-kayan-text' : 'text-kayan-muted line-through'}`}>
                    {item.name}
                  </h3>
                  <div className="flex gap-2 mt-1">
                    <span className="text-[10px] text-kayan-gold font-mono">{item.price} EGP</span>
                    <span className="text-[10px] text-kayan-sub uppercase tracking-wider">{item.category}</span>
                  </div>
                </div>
              </div>

              {/* The Toggle Button */}
              <button
                onClick={() => handleToggle(item)}
                className={`px-4 py-2 text-[10px] font-bold tracking-widest rounded-lg border transition-all duration-200 ${
                  item.is_available
                    ? 'bg-green-500/10 text-green-400 border-green-500/30 hover:bg-green-500/20'
                    : 'bg-red-500/10 text-red-400 border-red-500/30 hover:bg-red-500/20'
                }`}
              >
                {item.is_available ? 'AVAILABLE' : 'OUT OF STOCK'}
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}