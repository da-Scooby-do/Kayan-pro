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
        const idx = i + 1
        const done = current > idx
        const active = current === idx
        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className={`
                w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold
                transition-all duration-300
                ${done ? 'bg-green-500/20 border border-green-500/50 text-green-400' : ''}
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
function StepCustomer({ selected, onSelect, inviterId, inviterInfo, onPickInviter }) {
  const { loadCustomers, checkCustomerSession } = useKayan()
  const customers = useKayanStore(s => s.customers)
  const customersLoading = useKayanStore(s => s.customersLoading)

  const [search, setSearch] = useState('')
  const [sessionStatus, setSessionStatus] = useState({}) // { [userId]: 'checking'|'active'|'free' }

  useEffect(() => { loadCustomers() }, []) // eslint-disable-line

  // Check active-session status for each customer lazily
  const checkStatus = useCallback(async (userId) => {
    if (sessionStatus[userId]) return
    setSessionStatus(p => ({ ...p, [userId]: 'checking' }))
    const s = await checkCustomerSession(userId)
    setSessionStatus(p => ({ ...p, [userId]: s ? 'active' : 'free' }))
  }, [sessionStatus, checkCustomerSession])

  const q = search.trim().toLowerCase()
  const filtered = customers.filter(c => {
    if (!q) return true
    return (
      c.full_name?.toLowerCase().includes(q) ||
      c.phone?.toLowerCase().includes(q) ||
      c.username?.toLowerCase().includes(q) ||
      c.id?.toLowerCase().includes(q)
    )
  })

  return (
    <div>
      <h3 className="font-display text-xl font-semibold mb-1">Select Customer</h3>
      <p className="text-kayan-sub text-sm mb-5">
        Choose the customer to check in
      </p>

      {/* Search */}
      <div className="relative mb-4">
        <input
          type="text"
          placeholder="Search by name, phone or ID…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="kayan-input pr-8"
          autoFocus
        />
        {search && (
          <button
            onClick={() => setSearch('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-kayan-muted
                       hover:text-kayan-sub transition-colors cursor-pointer
                       bg-transparent border-none text-sm"
          >
            ×
          </button>
        )}
      </div>
      {/* Search hint chips */}
      {!search && (
        <div className="flex gap-2 mb-3 flex-wrap">
          {['By name', 'By phone', 'By ID (USR-)'].map(hint => (
            <span key={hint}
              className="text-[9px] text-kayan-muted bg-white/[0.03]
                         border border-white/[0.06] rounded-full px-2 py-0.5">
              {hint}
            </span>
          ))}
        </div>
      )}

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
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold truncate">{c.full_name}</p>
                  {c.sub_status === 'active' && (
                    <span className="text-[8px] font-bold text-kayan-bg bg-kayan-gold
                                     px-1.5 py-0.5 rounded-full flex-shrink-0">✦ SUB</span>
                  )}
                </div>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  {c.phone && (
                    <span className="text-[10px] text-kayan-muted">📱 {c.phone}</span>
                  )}
                  {c.username && (
                    <span className="text-[9px] text-kayan-muted font-mono bg-white/[0.04]
                                     px-1.5 py-0.5 rounded-md">
                      {c.username}
                    </span>
                  )}
                  {c.sub_days_remaining > 0 && (
                    <span className="text-[9px] text-kayan-gold">
                      {c.sub_days_remaining}d left
                    </span>
                  )}
                </div>
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

      {/* ── Invitation toggle ──────────────────────────────── */}
      <InviterPicker
        inviterId={inviterId}
        inviterInfo={inviterInfo}
        customers={customers}
        onPickInviter={onPickInviter}
      />
    </div>
  )
}

// ── InviterPicker sub-component ─────────────────────────────
function InviterPicker({ inviterId, inviterInfo, customers, onPickInviter }) {
  const [open,         setOpen]         = useState(false)
  const [search,       setSearch]       = useState('')
  const [loadingInfo,  setLoadingInfo]  = useState(false)

  const toggle = () => {
    if (open) { onPickInviter(null); setSearch('') }
    setOpen(v => !v)
  }

  const pick = async (c) => {
    setLoadingInfo(true)
    setSearch(c.full_name ?? '')
    await onPickInviter(c)
    setLoadingInfo(false)
  }

  const q = search.trim().toLowerCase()
  const filtered = open && !inviterId
    ? customers.filter(c =>
        c.full_name?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q)
      ).slice(0, 8)
    : []

  const remaining = inviterInfo?.invitations_remaining ?? null
  const noInv = remaining !== null && remaining <= 0

  return (
    <div className="mt-5 border-t border-white/[0.05] pt-4">
      <button
        type="button"
        onClick={toggle}
        className={`flex items-center gap-2 text-xs font-medium transition-colors cursor-pointer bg-transparent border-none px-0
          ${open ? 'text-kayan-gold' : 'text-kayan-muted hover:text-kayan-sub'}`}
      >
        <span className={`w-4 h-4 rounded-full border flex items-center justify-center text-[9px]
          ${open ? 'border-kayan-gold text-kayan-gold bg-kayan-gold/10' : 'border-white/20'}`}>
          {open ? '✓' : '+'}
        </span>
        {open ? 'Using an invitation — tap to cancel' : 'Using an invitation pass'}
      </button>

      {open && (
        <div className="mt-3 space-y-2">
          {!inviterId ? (
            <>
              <input
                type="text"
                placeholder="Search subscriber by name or phone…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="kayan-input text-sm"
                autoFocus
              />
              <div className="space-y-1 max-h-36 overflow-y-auto">
                {filtered.map(c => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => pick(c)}
                    className="w-full flex items-center gap-3 p-2.5 rounded-xl cursor-pointer
                               bg-white/[0.025] border border-white/[0.05]
                               hover:border-kayan-gold/25 hover:bg-white/[0.04]
                               transition-all text-left"
                  >
                    <div className="w-7 h-7 rounded-full flex items-center justify-center
                                    text-xs font-bold text-kayan-gold bg-kayan-gold/10 flex-shrink-0">
                      {(c.full_name ?? 'G')[0].toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-medium">{c.full_name}</p>
                      {c.phone && <p className="text-[10px] text-kayan-muted">{c.phone}</p>}
                    </div>
                    {c.sub_status === 'active' && (
                      <span className="ml-auto text-[8px] font-bold text-kayan-bg bg-kayan-gold px-1.5 py-0.5 rounded-full">
                        ❆ SUB
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </>
          ) : (
            // ── Inviter selected ───────────────────────────
            <div className={`rounded-xl p-3 border ${
              noInv ? 'bg-red-500/[0.07] border-red-500/25' : 'bg-kayan-gold/[0.06] border-kayan-gold/25'
            }`}>
              {loadingInfo ? (
                <p className="text-[10px] text-kayan-muted">Checking invitations…</p>
              ) : noInv ? (
                <>
                  <p className="text-xs font-semibold text-red-400 mb-0.5">⚠ No invitations remaining</p>
                  <p className="text-[10px] text-kayan-muted">
                    This subscriber has used all their invitations.
                    You can still proceed; the session will charge normal rates.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-xs font-semibold text-kayan-gold mb-0.5">✠ Invitation Pass</p>
                  <p className="text-[10px] text-kayan-muted">
                    {remaining !== null ? `${remaining} invitation${remaining === 1 ? '' : 's'} remaining` : 'Checking…'}
                    {' '}— stay will be <strong className="text-kayan-text">free</strong>; orders only.
                  </p>
                </>
              )}
              <button
                type="button"
                onClick={() => { onPickInviter(null); setSearch('') }}
                className="text-[10px] text-kayan-muted hover:text-kayan-sub mt-2 cursor-pointer bg-transparent border-none"
              >
                × Change inviter
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ── Step 2: Pick a seat ───────────────────────────────────────
function StepSeat({ selectedSeatId, onSelect }) {
  const rooms = useKayanStore(s => s.rooms)
  const seats = useKayanStore(s => s.seats)

  const [activeRoomId, setActiveRoomId] = useState(rooms[0]?.id ?? null)

  useEffect(() => {
    if (rooms.length && !activeRoomId) setActiveRoomId(rooms[0].id)
  }, [rooms, activeRoomId])

  const currentRoom = rooms.find(r => r.id === activeRoomId)
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
          if (isSelected) cls = 'bg-kayan-gold/25 border-kayan-gold/70 text-kayan-gold scale-110'
          else if (isOccupied) cls = 'bg-red-500/10 border-red-500/35 text-red-400 cursor-not-allowed opacity-70'
          else cls = 'bg-green-500/10 border-green-500/40 text-green-400 cursor-pointer hover:bg-green-500/25 hover:scale-110'

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
function StepConfirm({ customer, seatId, rooms, seats, inviterId, inviterInfo }) {
  // BUG-04 FIX: Don't split UUID to extract room ID — search all rooms' seats directly
  let room = null
  let seat = null
  for (const r of rooms) {
    const roomSeats = seats[r.id] ?? []
    const found = roomSeats.find(s => s.id === seatId)
    if (found) { room = r; seat = found; break }
  }

  const usingInvitation = !!inviterId
  const remaining = inviterInfo?.invitations_remaining ?? null

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
              {room?.name ?? '—'} · Seat #{seat?.seat_number ?? '?'}
            </p>
            <p className="text-xs text-kayan-muted">{room?.name_ar ?? ''}</p>
          </div>
        </div>

        {/* Billing info — changes based on invitation */}
        {usingInvitation ? (
          <div className="flex items-center gap-3 p-4 rounded-xl
                          bg-kayan-gold/[0.06] border border-kayan-gold/30">
            <span className="text-2xl">✉️</span>
            <div>
              <p className="font-semibold text-sm text-kayan-gold">Invitation Pass</p>
              <p className="text-xs text-kayan-muted">
                Stay is <strong className="text-green-400">free</strong> — orders only
                {remaining !== null && ` · ${remaining - 1 >= 0 ? remaining - 1 : 0} invitations left after`}
              </p>
            </div>
          </div>
        ) : (
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
        )}
      </div>

      <p className="text-[10px] text-kayan-muted mt-5 text-center">
        Session starts at check-in time. Customer can order immediately after.
      </p>
    </div>
  )
}

// ── Main Modal ────────────────────────────────────────────────
// initialSeatId: when set, skips seat-selection step and pre-selects the seat.
export default function AdminOpenSession({ onClose, onSuccess, initialSeatId = null }) {
  const { handleOpenSession, handleOpenInvitationSession, loadSeats, getInviterInfo } = useKayan()
  const profile = useKayanStore(s => s.profile)
  const rooms = useKayanStore(s => s.rooms)
  const seats = useKayanStore(s => s.seats)

  const [step, setStep] = useState(1)
  const [customer, setCustomer] = useState(null)
  const [seatId, setSeatId] = useState(initialSeatId)
  const [loading, setLoading] = useState(false)
  // Invitation
  const [inviterId,    setInviterId]    = useState(null)  // subscriber giving the invitation
  const [inviterInfo,  setInviterInfo]  = useState(null)  // { invitations_remaining, plan }

  // Keep seats fresh while modal is open
  useEffect(() => { loadSeats() }, []) // eslint-disable-line

  const canNext = step === 1 ? !!customer : step === 2 ? !!seatId : true

  // When seat is pre-selected and customer clicks Next on step 1, jump to confirm
  // BUG-17 FIX: Guard against advancing when no customer is selected
  // (canNext already disables the button, but this prevents any edge case)
  const handleNext = () => {
    if (!customer) return
    if (step === 1 && initialSeatId) { onSelectCustomer(customer); return }
    setStep(s => s + 1)
  }

  // When inviter is picked, load their invitation info
  const pickInviter = async (inviterCustomer) => {
    setInviterId(inviterCustomer?.id ?? null)
    if (!inviterCustomer) { setInviterInfo(null); return }
    const info = await getInviterInfo(inviterCustomer.id)
    setInviterInfo(info)
  }

  const handleConfirm = async () => {
    if (!customer || !seatId) return
    setLoading(true)
    try {
      if (inviterId) {
        // Invitation session — stay is free, orders only
        await handleOpenInvitationSession({
          userId:    customer.id,
          seatId:    seatId,
          packageId: 1,
          adminId:   profile?.id,
          inviterId,
        })
      } else {
        // Normal session
        await handleOpenSession({
          userId: customer.id,
          seatId,
          packageId: 1,
          adminId: profile?.id,
        })
      }
      onSuccess?.()
      onClose()
    } catch {
      // error toasted inside hook
    } finally {
      setLoading(false)
    }
  }

  // If a seat was pre-selected from the floor plan, skip step 2 and go straight to confirm.
  const onSelectCustomer = (c) => {
    setCustomer(c)
    setStep(initialSeatId ? 3 : 2)
  }

  // Back navigation: if seat was pre-selected, step 3 goes back to step 1 (skip step 2).
  const goBack = () => {
    if (step === 2) setStep(1)
    else if (step === 3) setStep(initialSeatId ? 1 : 2)
  }

  const VIEW = {
    1: <StepCustomer
      selected={customer}
      onSelect={onSelectCustomer}
      inviterId={inviterId}
      inviterInfo={inviterInfo}
      onPickInviter={pickInviter}
    />,
    2: <StepSeat
      selectedSeatId={seatId}
      onSelect={s => { setSeatId(s.id); setStep(3) }}
    />,
    3: <StepConfirm
         customer={customer} seatId={seatId} rooms={rooms} seats={seats}
         inviterId={inviterId} inviterInfo={inviterInfo}
       />,
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
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
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
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -8 }}
              transition={{ duration: 0.18 }}
            >
              {VIEW[step]}
            </motion.div>
          </AnimatePresence>

          {/* Footer navigation */}
          <div className="flex gap-3 mt-7 pt-5 border-t border-white/[0.05]">
            {step > 1 ? (
              <button
                onClick={goBack}
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
                onClick={handleNext}
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
