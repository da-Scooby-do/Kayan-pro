import { useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useKayan } from '@/hooks/useKayan'
import useKayanStore from '@/store/useKayanStore'

// ── Step indicators ───────────────────────────────────────────
function Steps({ current }) {
  const steps = ['Customer', 'Seat', 'Confirm']
  return (
    <div className="flex items-center gap-0 mb-8">
      {steps.map((label, i) => {
        const idx    = i + 1
        const done   = current > idx
        const active = current === idx
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${done   ? 'bg-green-500/20 border border-green-500/50 text-green-400'   : ''}
                ${active ? 'bg-kayan-gold/20 border border-kayan-gold/60 text-kayan-gold' : ''}
                ${!done && !active ? 'bg-white/[0.04] border border-white/[0.08] text-kayan-muted' : ''}
              `}>
                {done ? '✓' : idx}
              </div>
              <span className={`text-[9px] tracking-wide whitespace-nowrap
                ${active ? 'text-kayan-gold' : done ? 'text-green-400' : 'text-kayan-muted'}`}>
                {label.toUpperCase()}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className={`flex-1 h-px mx-2 mb-5 transition-colors duration-300
                ${done ? 'bg-green-500/30' : 'bg-white/[0.06]'}`}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Step 1: Pick a customer ───────────────────────────────────
function StepCustomer({ selected, onSelect }) {
  const { loadCustomers, checkCustomerSession } = useKayan()
  const { customers, customersLoading } = useKayanStore(s => ({
    customers:        s.customers,
    customersLoading: s.customersLoading,
  }))

  const [search,        setSearch]        = useState('')
  const [sessionStatus, setSessionStatus] = useState({}) // { [userId]: 'checking'|'active'|'free' }

  useEffect(() => { loadCustomers() }, []) // eslint-disable-line

  // Check active-session status for each customer lazily
  const checkStatus = useCallback(async (userId) => {
    if (sessionStatus[userId]) return
    setSessionStatus(p => ({ ...p, [userId]: 'checking' }))
    const s = await checkCustomerSession(userId)
    setSessionStatus(p => ({ ...p, [userId]: s ? 'active' : 'free' }))
  }, [sessionStatus, checkCustomerSession])

  const filtered = customers.filter(c =>
    !search || c.full_name?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <h3 className="font-display text-xl font-semibold mb-1">Select Customer</h3>
      <p className="text-kayan-sub text-sm mb-5">
        Choose the customer to check in
      </p>

      {/* Search */}
      <input
        type="text"
        placeholder="Search by name…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        className="kayan-input mb-4"
      />

      {/* List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {customersLoading && (
          <p className="text-kayan-muted text-sm text-center py-8">Loading customers…</p>
        )}

        {!customersLoading && filtered.length === 0 && (
          <div className="text-center py-8">
            <p className="text-kayan-muted text-sm">No customers found.</p>
            <p className="text-kayan-muted text-xs mt-1">
              Ask the customer to sign up first via the app.
            </p>
          </div>
        )}

        {filtered.map(c => {
          const status = sessionStatus[c.id]
          const isActive = status === 'active'

          return (
            <div
              key={c.id}
              onMouseEnter={() => checkStatus(c.id)}
              onClick={() => !isActive && onSelect(c)}
              className={`
                flex items-center gap-3 p-3 rounded-xl border
                transition-all duration-200
                ${selected?.id === c.id
                  ? 'bg-kayan-gold/10 border-kayan-gold/45 cursor-pointer'
                  : isActive
                    ? 'bg-white/[0.02] border-white/[0.04] opacity-50 cursor-not-allowed'
                    : 'bg-white/[0.025] border-white/[0.05] cursor-pointer hover:border-kayan-gold/25 hover:bg-white/[0.04]'
                }
              `}
            >
              {/* Avatar */}
              <div className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center
                              text-sm font-bold text-kayan-gold
                              bg-kayan-gold/10 border border-kayan-border">
                {(c.full_name ?? 'G')[0].toUpperCase()}
              </div>

            <div className="flex-1 min-w-0">
  <p className="text-sm font-semibold truncate">{c.full_name}</p>
  <p className="text-[10px] text-kayan-muted">
    {c.username ?? c.phone ?? ''}
  </p>
</div>

              {/* Status chip */}
              <div className="flex-shrink-0">
                {status === 'checking' && (
                  <span className="text-[9px] text-kayan-muted">Checking…</span>
                )}
                {status === 'active' && (
                  <span className="text-[9px] text-red-400 bg-red-500/10
                                   px-2 py-0.5 rounded-full border border-red-500/20">
                    Already in
                  </span>
                )}
                {status === 'free' && (
                  <span className="text-[9px] text-green-400 bg-green-500/10
                                   px-2 py-0.5 rounded-full border border-green-500/20">
                    Available
                  </span>
                )}
                {selected?.id === c.id && (
                  <span className="text-kayan-gold text-base">✓</span>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Step 2: Pick a seat ───────────────────────────────────────
function StepSeat({ selectedSeatId, onSelect }) {
  const { rooms, seats } = useKayanStore(s => ({
    rooms: s.rooms,
    seats: s.seats,
  }))

  const [activeRoomId, setActiveRoomId] = useState(rooms[0]?.id ?? null)

  useEffect(() => {
    if (rooms.length && !activeRoomId) setActiveRoomId(rooms[0].id)
  }, [rooms, activeRoomId])

  const currentRoom  = rooms.find(r => r.id === activeRoomId)
  const currentSeats = (seats[activeRoomId] ?? [])

  return (
    <div>
      <h3 className="font-display text-xl font-semibold mb-1">Select Seat</h3>
      <p className="text-kayan-sub text-sm mb-5">
        Pick an available seat for this customer
      </p>

      {/* Room tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {rooms.map(r => (
          <button
            key={r.id}
            onClick={() => setActiveRoomId(r.id)}
            className={`kayan-tab ${activeRoomId === r.id ? 'active' : ''}`}
          >
            {r.name}
          </button>
        ))}
      </div>

      {/* Room header */}
      {currentRoom && (
        <div className="flex justify-between items-center mb-3">
          <p className="text-xs text-kayan-sub">
            {currentRoom.name} · {currentRoom.name_ar} · {currentRoom.capacity} seats
          </p>
          <div className="flex gap-3 text-[10px] text-kayan-sub">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-green-400/70" />Free
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-kayan-gold/70" />Selected
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm bg-red-400/70" />Taken
            </span>
          </div>
        </div>
      )}

      {/* Seat grid */}
      <div className="flex flex-wrap gap-2">
        {currentSeats.map(seat => {
          const isSelected = selectedSeatId === seat.id
          const isOccupied = seat.is_occupied

          let cls = ''
          if (isSelected)       cls = 'bg-kayan-gold/25 border-kayan-gold/70 text-kayan-gold scale-110'
          else if (isOccupied)  cls = 'bg-red-500/10 border-red-500/35 text-red-400 cursor-not-allowed opacity-70'
          else                  cls = 'bg-green-500/10 border-green-500/40 text-green-400 cursor-pointer hover:bg-green-500/25 hover:scale-110'

          return (
            <button
              key={seat.id}
              disabled={isOccupied}
              onClick={() => !isOccupied && onSelect(seat)}
              className={`
                w-9 h-9 rounded-lg text-[10px] font-semibold
                flex items-center justify-center flex-shrink-0
                transition-all duration-150 border
                ${cls}
              `}
            >
              {seat.seat_number}
            </button>
          )
        })}
      </div>

      {selectedSeatId && (
        <motion.p
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-xs text-kayan-gold mt-4 flex items-center gap-1.5"
        >
          <span className="w-1.5 h-1.5 rounded-full bg-kayan-gold inline-block" />
          Seat {selectedSeatId.split('-')[1]} selected in {currentRoom?.name}
        </motion.p>
      )}
    </div>
  )
}

// ── Step 3: Confirm ───────────────────────────────────────────
function StepConfirm({ customer, seatId, rooms, seats }) {
  // Resolve seat + room names from IDs
  const [roomId] = seatId?.split('-') ?? []
  const room     = rooms.find(r => r.id === Number(roomId))
  const roomSeats = seats[Number(roomId)] ?? []
  const seat     = roomSeats.find(s => s.id === seatId)

  return (
    <div>
      <h3 className="font-display text-xl font-semibold mb-1">Confirm Check-in</h3>
      <p className="text-kayan-sub text-sm mb-6">
        Review and confirm the session details
      </p>

      <div className="space-y-3">
        {/* Customer card */}
        <div className="flex items-center gap-3 p-4 rounded-xl
                        bg-kayan-gold/[0.06] border border-kayan-gold/20">
          <div className="w-11 h-11 rounded-full flex items-center justify-center
                          text-lg font-bold text-kayan-gold bg-kayan-gold/10 border border-kayan-border">
            {(customer?.full_name ?? 'G')[0]}
          </div>
          <div>
            <p className="font-semibold text-sm">{customer?.full_name}</p>
            {customer?.phone && (
              <p className="text-xs text-kayan-muted">{customer.phone}</p>
            )}
          </div>
        </div>

        {/* Location card */}
        <div className="flex items-center gap-3 p-4 rounded-xl
                        bg-white/[0.03] border border-white/[0.06]">
          <span className="text-2xl">🪑</span>
          <div>
            <p className="font-semibold text-sm">
              {room?.name} · Seat #{seat?.seat_number}
            </p>
            <p className="text-xs text-kayan-muted">{room?.name_ar}</p>
          </div>
        </div>

        {/* Billing info */}
        <div className="flex items-center gap-3 p-4 rounded-xl
                        bg-white/[0.03] border border-white/[0.06]">
          <span className="text-2xl">⏱</span>
          <div>
            <p className="font-semibold text-sm">Standard Package</p>
            <p className="text-xs text-kayan-muted">
              15 EGP/hr · 75 EGP daily cap after 6h
            </p>
          </div>
        </div>
      </div>

      <p className="text-[10px] text-kayan-muted mt-5 text-center">
        Session starts at check-in time. Customer can order immediately after.
      </p>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────
export default function AdminOpenSession({ onClose, onSuccess }) {
  const { handleOpenSession, loadSeats } = useKayan()
  const { profile, rooms, seats } = useKayanStore(s => ({
    profile: s.profile,
    rooms:   s.rooms,
    seats:   s.seats,
  }))

  const [step,     setStep]     = useState(1)
  const [customer, setCustomer] = useState(null)
  const [seatId,   setSeatId]   = useState(null)
  const [loading,  setLoading]  = useState(false)

  // Keep seats fresh while modal is open
  useEffect(() => { loadSeats() }, []) // eslint-disable-line

  const canNext = step === 1 ? !!customer : step === 2 ? !!seatId : true

  const handleConfirm = async () => {
    if (!customer || !seatId) return
    setLoading(true)
    try {
      await handleOpenSession({
        userId:    customer.id,
        seatId,
        packageId: 1,
        adminId:   profile?.id,
      })
      onSuccess?.()
      onClose()
    } catch {
      // error toasted inside handleOpenSession
    } finally {
      setLoading(false)
    }
  }

  const VIEW = {
    1: <StepCustomer
          selected={customer}
          onSelect={c => { setCustomer(c); setStep(2) }}
        />,
    2: <StepSeat
          selectedSeatId={seatId}
          onSelect={s => { setSeatId(s.id); setStep(3) }}
        />,
    3: <StepConfirm customer={customer} seatId={seatId} rooms={rooms} seats={seats} />,
  }

  return (
    <AnimatePresence>
      <motion.div
        key="overlay"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[8000] flex items-end sm:items-center justify-center p-0 sm:p-5"
        style={{ background: 'rgba(7,7,14,0.9)', backdropFilter: 'blur(12px)' }}
        onClick={onClose}
      >
        <motion.div
          key="modal"
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0  }}
          exit={{   opacity: 0, y: 30  }}
          transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="glass border border-kayan-border rounded-t-3xl sm:rounded-3xl
                     w-full sm:max-w-lg p-7"
          style={{ maxHeight: '92vh', overflowY: 'auto' }}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <p className="text-[8px] tracking-[3px] text-kayan-muted uppercase mb-0.5">
                Admin · Check-in
              </p>
              <h2 className="font-display text-2xl font-bold">Open Session</h2>
            </div>
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-white/[0.05] hover:bg-white/[0.09]
                         flex items-center justify-center text-kayan-sub text-sm
                         transition-colors cursor-pointer border-none"
            >
              ✕
            </button>
          </div>

          <Steps current={step} />

          {/* Animated step content */}
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0  }}
              exit={{   opacity: 0, x: -8  }}
              transition={{ duration: 0.18 }}
            >
              {VIEW[step]}
            </motion.div>
          </AnimatePresence>

          {/* Footer navigation */}
          <div className="flex gap-3 mt-7 pt-5 border-t border-white/[0.05]">
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="btn-ghost flex-1"
                disabled={loading}
              >
                ← Back
              </button>
            ) : (
              <button onClick={onClose} className="btn-ghost flex-1">
                Cancel
              </button>
            )}

            {step < 3 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={!canNext}
                className="btn-gold flex-[2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next →
              </button>
            ) : (
              <button
                onClick={handleConfirm}
                disabled={loading || !canNext}
                className="btn-gold flex-[2] disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {loading ? 'Opening session…' : '✓ Check In'}
              </button>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}