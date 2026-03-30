import { AnimatePresence, motion } from 'framer-motion'
import useKayanStore from '@/store/useKayanStore'

const TYPE_STYLES = {
  ok:    'bg-green-500/10  border-green-500/30  text-green-300',
  info:  'bg-indigo-500/10 border-indigo-500/30 text-indigo-300',
  error: 'bg-red-500/10   border-red-500/30    text-red-300',
}

export default function Toast() {
  const toast = useKayanStore(s => s.toast)

  return (
    <AnimatePresence>
      {toast && (
        <motion.div
          key="toast"
          initial={{ opacity: 0, y: -14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0,   scale: 1    }}
          exit={{   opacity: 0, y: -10,  scale: 0.95 }}
          transition={{ duration: 0.22 }}
          className={`
            fixed top-4 right-4 z-[9999] max-w-xs
            px-4 py-3 rounded-2xl text-sm font-medium
            border backdrop-blur-xl shadow-glass
            ${TYPE_STYLES[toast.type] ?? TYPE_STYLES.ok}
          `}
        >
          {toast.msg}
        </motion.div>
      )}
    </AnimatePresence>
  )
}
