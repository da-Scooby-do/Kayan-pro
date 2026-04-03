import { useEffect, useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import useKayanStore from '@/store/useKayanStore'
import { useAuth } from '@/hooks/useAuth'

// ── Helpers ───────────────────────────────────────────────────
function fmt(n) { return Number(n ?? 0).toLocaleString('en-EG') }
function fmtEGP(n) { return `${fmt(n)} EGP` }
function ago(d) {
  if (!d) return '—'
  const m = Math.floor((Date.now() - new Date(d)) / 60000)
  if (m < 1)  return 'just now'
  if (m < 60) return `${m}m ago`
  return `${Math.floor(m / 60)}h ${m % 60}m ago`
}
function fmtDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-EG', {
    month: 'short', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

// ── Reusable stat card ────────────────────────────────────────
function StatCard({ label, value, sub, color = '#C9A84C', icon }) {
  return (
    <div className="glass rounded-2xl p-5 border border-white/[0.05]">
      <div className="flex items-start justify-between mb-3">
        <p className="text-[9px] text-kayan-muted tracking-[2.5px] uppercase">{label}</p>
        {icon && <span className="text-xl opacity-60">{icon}</span>}
      </div>
      <p className="font-display text-3xl font-bold mb-1" style={{ color }}>{value}</p>
      {sub && <p className="text-[11px] text-kayan-muted">{sub}</p>}
    </div>
  )
}

// ── Admin presence card ───────────────────────────────────────
function AdminPresenceCard({ admin }) {
  const isOnline  = admin.status === 'online'
  const sinceMin  = admin.session_start
    ? Math.floor((Date.now() - new Date(admin.session_start)) / 60000)
    : null

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-4 p-4 rounded-2xl border
                 bg-white/[0.02] border-white/[0.05]"
    >
      {/* Avatar */}
      <div className="w-11 h-11 rounded-full flex-shrink-0 flex items-center justify-center
                      text-base font-bold text-kayan-gold bg-kayan-gold/10 border border-kayan-border">
        {(admin.full_name ?? 'A')[0].toUpperCase()}
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <p className="text-sm font-semibold truncate">{admin.full_name}</p>
          {admin.username && (
            <span className="text-[9px] text-kayan-muted font-mono bg-white/[0.04]
                             px-1.5 py-0.5 rounded-md">
              {admin.username}
            </span>
          )}
        </div>
        <p className="text-[10px] text-kayan-muted">
          {isOnline
            ? sinceMin !== null
              ? `On shift for ${sinceMin < 60 ? `${sinceMin}m` : `${Math.floor(sinceMin/60)}h ${sinceMin%60}m`}`
              : 'Currently online'
            : `Last seen ${ago(admin.last_seen)}`
          }
        </p>
      </div>

      {/* Status */}
      <div className="flex items-center gap-1.5 flex-shrink-0">
        <span
          className="w-2.5 h-2.5 rounded-full"
          style={{
            background: isOnline ? '#22C55E' : '#505068',
            animation: isOnline ? 'pulse2 2s ease-in-out infinite' : 'none',
          }}
        />
        <span className={`text-[10px] font-medium ${isOnline ? 'text-green-400' : 'text-kayan-muted'}`}>
          {isOnline ? 'Online' : 'Offline'}
        </span>
      </div>
    </motion.div>
  )
}

// ── Revenue table ─────────────────────────────────────────────
function RevenueTable({ rows, period }) {
  if (!rows.length) return (
    <div className="text-center py-10 text-kayan-muted text-sm">
      No revenue data for this {period} yet.
    </div>
  )

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-white/[0.05]">
            {['Admin', period === 'day' ? 'Date' : 'Month',
              'Sessions', 'Stay', 'Orders', 'Total'].map(h => (
              <th key={h} className="text-left py-2.5 px-3 text-[9px] text-kayan-muted
                                     tracking-wider uppercase font-medium">
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i} className="border-b border-white/[0.03] hover:bg-white/[0.02]
                                   transition-colors">
              <td className="py-3 px-3">
                <p className="font-medium text-kayan-text">{r.admin_name}</p>
                {r.admin_username && (
                  <p className="text-[9px] text-kayan-muted font-mono">{r.admin_username}</p>
                )}
              </td>
              <td className="py-3 px-3 text-kayan-sub text-xs">
                {period === 'day' ? r.day : r.month}
              </td>
              <td className="py-3 px-3 text-center">
                <span className="text-kayan-gold font-bold">{r.sessions_count}</span>
              </td>
              <td className="py-3 px-3 text-kayan-sub text-xs">
                {fmtEGP(r.stay_revenue)}
              </td>
              <td className="py-3 px-3 text-kayan-sub text-xs">
                {fmtEGP(r.orders_revenue)}
              </td>
              <td className="py-3 px-3">
                <span className="text-kayan-gold font-bold text-base">
                  {fmtEGP(r.total_revenue)}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
        {/* Totals row */}
        <tfoot>
          <tr className="border-t border-kayan-border">
            <td colSpan={2} className="py-3 px-3 text-xs font-bold text-kayan-text">
              TOTAL
            </td>
            <td className="py-3 px-3 text-center font-bold text-kayan-gold">
              {rows.reduce((s, r) => s + Number(r.sessions_count), 0)}
            </td>
            <td className="py-3 px-3 text-xs font-bold text-kayan-sub">
              {fmtEGP(rows.reduce((s, r) => s + Number(r.stay_revenue ?? 0), 0))}
            </td>
            <td className="py-3 px-3 text-xs font-bold text-kayan-sub">
              {fmtEGP(rows.reduce((s, r) => s + Number(r.orders_revenue ?? 0), 0))}
            </td>
            <td className="py-3 px-3 font-display text-xl font-bold text-kayan-gold">
              {fmtEGP(rows.reduce((s, r) => s + Number(r.total_revenue ?? 0), 0))}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  )
}

// ── Audit log ─────────────────────────────────────────────────
function AuditLog({ sessions }) {
  if (!sessions.length) return (
    <div className="text-center py-10 text-kayan-muted text-sm">
      No completed sessions yet.
    </div>
  )

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
      {sessions.map(s => (
        <div key={s.id}
             className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02]
                        border border-white/[0.04] flex-wrap">
          <div className="flex-1 min-w-[140px]">
            <p className="text-xs font-semibold">{s.customer_name}</p>
            <p className="text-[9px] text-kayan-muted">
              {s.room_name} · Seat {s.seat_id?.split('-')[1]}
            </p>
          </div>
          <div className="text-[9px] text-kayan-muted min-w-[100px]">
            <p>{fmtDate(s.check_in)}</p>
            <p>→ {fmtDate(s.check_out)}</p>
          </div>
          <div className="text-[9px] text-kayan-sub text-right min-w-[80px]">
            <p>{s.hours_stayed}h · {s.admin_name ?? '—'}</p>
            {s.was_capped && <p className="text-green-400">Capped</p>}
          </div>
          <div className="font-bold text-kayan-gold text-sm min-w-[70px] text-right">
            {fmtEGP(s.total_cost)}
          </div>
        </div>
      ))}
    </div>
  )
}

// ── MAIN OWNER LAYOUT ─────────────────────────────────────────
export default function OwnerLayout() {
  const { handleSignOut } = useAuth()
  const profile = useKayanStore(s => s.profile)

  const [activeTab, setActiveTab] = useState('overview')
  const [loading,   setLoading]   = useState(true)

  // Data state
  const [overview,        setOverview]        = useState(null)
  const [admins,          setAdmins]          = useState([])
  const [revenueDaily,    setRevenueDaily]    = useState([])
  const [revenueMonthly,  setRevenueMonthly]  = useState([])
  const [auditLog,        setAuditLog]        = useState([])
  const [activeSessions,  setActiveSessions]  = useState([])
  const [revPeriod,       setRevPeriod]       = useState('month')

  const realtimeRef = useRef(null)

  // ── Load all data ─────────────────────────────────────────
  const loadAll = async () => {
    setLoading(true)
    try {
      const [
        { data: ov },
        { data: presence },
        { data: daily },
        { data: monthly },
        { data: log },
        { data: active },
      ] = await Promise.all([
        supabase.from('workspace_overview').select('*').maybeSingle(),
        supabase.from('admin_presence')
          .select('admin_id, status, last_seen, session_start, profile:profiles(full_name, username)')
          .order('status'),
        supabase.from('admin_revenue_daily').select('*').limit(60),
        supabase.from('admin_revenue_monthly').select('*').limit(24),
        supabase.from('owner_sessions_log').select('*').limit(100),
        supabase.from('active_sessions_view').select('*'),
      ])

      setOverview(ov)
      setAdmins((presence ?? []).map(p => ({
        ...p,
        full_name: p.profile?.full_name,
        username:  p.profile?.username,
      })))
      setRevenueDaily(daily ?? [])
      setRevenueMonthly(monthly ?? [])
      setAuditLog(log ?? [])
      setActiveSessions(active ?? [])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadAll()

    // Realtime: re-fetch when presence changes
    realtimeRef.current = supabase
      .channel('owner-presence-watch')
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'admin_presence',
      }, () => loadAll())
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'sessions',
      }, () => loadAll())
      .subscribe()

    // Refresh every 2 minutes
    const poll = setInterval(loadAll, 120_000)

    return () => {
      realtimeRef.current?.unsubscribe()
      clearInterval(poll)
    }
  }, []) // eslint-disable-line

  const TABS = [
    { id: 'overview',  icon: '📊', label: 'Overview'  },
    { id: 'admins',    icon: '👥', label: 'Admins'    },
    { id: 'revenue',   icon: '💰', label: 'Revenue'   },
    { id: 'log',       icon: '📋', label: 'Audit Log' },
  ]

  const onlineAdmins  = admins.filter(a => a.status === 'online')
  const offlineAdmins = admins.filter(a => a.status !== 'online')

  return (
    <div className="min-h-screen bg-kayan-bg text-kayan-text font-sans flex flex-col">

      {/* ── Top bar ──────────────────────────────────────────── */}
      <header className="glass border-b border-kayan-border px-6 py-4
                         flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="gold-text font-display text-2xl font-bold leading-none block">
              كيان
            </h1>
            <p className="text-[8px] tracking-[4px] text-kayan-gold/40">OWNER · KAYAN</p>
          </div>
          {/* Live workspace pulse */}
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full
                          bg-green-500/[0.07] border border-green-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-green-400"
                  style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
            <span className="text-[10px] text-green-400 font-medium">
              {overview?.active_now ?? 0} active · {overview?.admins_online ?? 0} staff online
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button onClick={loadAll}
            className="btn-ghost text-xs px-3 py-1.5">
            ↻ Refresh
          </button>
          <button onClick={handleSignOut} className="btn-ghost text-xs px-3 py-1.5">
            ← Sign Out
          </button>
        </div>
      </header>

      {/* ── Tab bar ──────────────────────────────────────────── */}
      <div className="glass border-b border-white/[0.05] px-6 flex gap-1">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`flex items-center gap-2 px-4 py-3 text-xs font-medium
                        transition-all duration-200 cursor-pointer border-none bg-transparent
                        ${activeTab === t.id
                          ? 'text-kayan-gold border-b-2 border-kayan-gold'
                          : 'text-kayan-muted hover:text-kayan-sub'
                        }`}
            style={{ borderBottom: activeTab === t.id ? '2px solid #C9A84C' : '2px solid transparent' }}
          >
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── Main content ─────────────────────────────────────── */}
      <main className="flex-1 overflow-auto p-6 max-w-6xl mx-auto w-full">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 animate-pulse">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-28 rounded-2xl bg-white/[0.04]" />
            ))}
          </div>
        ) : (
          <AnimatePresence mode="wait">
            <motion.div key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}>

              {/* ── OVERVIEW TAB ───────────────────────────── */}
              {activeTab === 'overview' && (
                <div>
                  <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold mb-1">Workspace Overview</h2>
                    <p className="text-kayan-sub text-sm">Live snapshot · Alexandria</p>
                  </div>

                  {/* Today stats */}
                  <p className="text-[9px] text-kayan-muted tracking-[3px] uppercase mb-3">Today</p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
                    <StatCard icon="🪑" label="Sessions Today"
                      value={overview?.today_sessions ?? 0}
                      sub="completed checkouts" />
                    <StatCard icon="💰" label="Revenue Today"
                      value={fmtEGP(overview?.today_revenue)}
                      color="#22C55E"
                      sub="from checkouts" />
                    <StatCard icon="⏱" label="Active Now"
                      value={overview?.active_now ?? 0}
                      color="#818CF8"
                      sub="customers in workspace" />
                    <StatCard icon="👤" label="Staff Online"
                      value={overview?.admins_online ?? 0}
                      color="#F59E0B"
                      sub="currently working" />
                  </div>

                  {/* This month */}
                  <p className="text-[9px] text-kayan-muted tracking-[3px] uppercase mb-3">
                    This Month
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
                    <StatCard icon="📅" label="Sessions This Month"
                      value={overview?.month_sessions ?? 0}
                      sub="completed" />
                    <StatCard icon="💵" label="Revenue This Month"
                      value={fmtEGP(overview?.month_revenue)}
                      color="#22C55E"
                      sub="total collected" />
                    <StatCard icon="📈" label="All-Time Revenue"
                      value={fmtEGP(overview?.total_revenue)}
                      color="#C9A84C"
                      sub={`${overview?.total_sessions ?? 0} total sessions`} />
                  </div>

                  {/* Active sessions live */}
                  {activeSessions.length > 0 && (
                    <>
                      <p className="text-[9px] text-kayan-muted tracking-[3px] uppercase mb-3">
                        Currently In Workspace ({activeSessions.length})
                      </p>
                      <div className="glass rounded-2xl border border-white/[0.05] p-4 mb-4">
                        <div className="space-y-2">
                          {activeSessions.map(s => (
                            <div key={s.id}
                                 className="flex items-center justify-between flex-wrap gap-2
                                            p-3 rounded-xl bg-white/[0.025]">
                              <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-green-400"
                                      style={{ animation: 'pulse2 2s ease-in-out infinite' }} />
                                <p className="text-sm font-medium">{s.customer_name}</p>
                                <p className="text-[10px] text-kayan-muted">
                                  {s.room_name} · Seat {s.seat_id?.split('-')[1]}
                                </p>
                              </div>
                              <div className="flex items-center gap-4">
                                <p className="text-[10px] text-kayan-muted">
                                  {Number(s.hours_so_far ?? 0).toFixed(1)}h elapsed
                                </p>
                                <p className="text-sm font-bold text-kayan-gold">
                                  ~{fmtEGP(s.estimated_total)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* ── ADMINS TAB ─────────────────────────────── */}
              {activeTab === 'admins' && (
                <div>
                  <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold mb-1">Staff Status</h2>
                    <p className="text-kayan-sub text-sm">
                      Who's currently in the workspace and working
                    </p>
                  </div>

                  {admins.length === 0 ? (
                    <div className="glass rounded-2xl border border-white/[0.05] p-10 text-center">
                      <p className="text-kayan-muted text-sm">
                        No staff activity recorded yet. Admins appear here once they log in.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {onlineAdmins.length > 0 && (
                        <>
                          <p className="text-[9px] text-kayan-muted tracking-[3px] uppercase mb-2">
                            Online Now ({onlineAdmins.length})
                          </p>
                          {onlineAdmins.map(a => (
                            <AdminPresenceCard key={a.admin_id} admin={a} />
                          ))}
                        </>
                      )}

                      {offlineAdmins.length > 0 && (
                        <>
                          <p className="text-[9px] text-kayan-muted tracking-[3px] uppercase mb-2 mt-6">
                            Offline
                          </p>
                          {offlineAdmins.map(a => (
                            <AdminPresenceCard key={a.admin_id} admin={a} />
                          ))}
                        </>
                      )}
                    </div>
                  )}

                  {/* Per-admin all-time stats from sessions */}
                  {revenueMonthly.length > 0 && (
                    <div className="mt-8">
                      <p className="text-[9px] text-kayan-muted tracking-[3px] uppercase mb-4">
                        Performance — This Month
                      </p>
                      <div className="glass rounded-2xl border border-white/[0.05] p-4 overflow-x-auto">
                        <RevenueTable rows={
                          // Filter to current month
                          revenueMonthly.filter(r => r.month === new Date().toISOString().slice(0,7))
                        } period="month" />
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* ── REVENUE TAB ────────────────────────────── */}
              {activeTab === 'revenue' && (
                <div>
                  <div className="flex items-start justify-between flex-wrap gap-4 mb-6">
                    <div>
                      <h2 className="font-display text-2xl font-bold mb-1">Revenue Breakdown</h2>
                      <p className="text-kayan-sub text-sm">
                        Every penny — per admin, per period
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {[
                        { id: 'day',   label: 'Daily'   },
                        { id: 'month', label: 'Monthly' },
                      ].map(p => (
                        <button key={p.id} onClick={() => setRevPeriod(p.id)}
                          className={`kayan-tab ${revPeriod === p.id ? 'active' : ''}`}>
                          {p.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="glass rounded-2xl border border-white/[0.05] p-5">
                    <RevenueTable
                      rows={revPeriod === 'day' ? revenueDaily : revenueMonthly}
                      period={revPeriod}
                    />
                  </div>

                  {/* Totals */}
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-6">
                    <StatCard label={`Total Sessions (${revPeriod === 'day' ? 'All Days' : 'All Months'})`}
                      value={(revPeriod === 'day' ? revenueDaily : revenueMonthly)
                        .reduce((s, r) => s + Number(r.sessions_count), 0)}
                      icon="🪑" />
                    <StatCard label="Total Stay Revenue"
                      value={fmtEGP((revPeriod === 'day' ? revenueDaily : revenueMonthly)
                        .reduce((s, r) => s + Number(r.stay_revenue ?? 0), 0))}
                      color="#818CF8" icon="⏱" />
                    <StatCard label="Total Orders Revenue"
                      value={fmtEGP((revPeriod === 'day' ? revenueDaily : revenueMonthly)
                        .reduce((s, r) => s + Number(r.orders_revenue ?? 0), 0))}
                      color="#F59E0B" icon="☕" />
                  </div>
                </div>
              )}

              {/* ── AUDIT LOG TAB ───────────────────────────── */}
              {activeTab === 'log' && (
                <div>
                  <div className="mb-6">
                    <h2 className="font-display text-2xl font-bold mb-1">Session Audit Log</h2>
                    <p className="text-kayan-sub text-sm">
                      Every session — customer, seat, duration, revenue, admin
                    </p>
                  </div>

                  <div className="glass rounded-2xl border border-white/[0.05] p-4">
                    <AuditLog sessions={auditLog} />
                  </div>
                </div>
              )}

            </motion.div>
          </AnimatePresence>
        )}
      </main>
    </div>
  )
}