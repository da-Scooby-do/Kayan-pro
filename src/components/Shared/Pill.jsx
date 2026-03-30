export default function Pill({ label, value, valueColor, sub }) {
  return (
    <div className="stat-card">
      <p className="text-[9px] text-kayan-muted tracking-[2.5px] uppercase mb-2">
        {label}
      </p>
      <p
        className="text-2xl font-bold font-display"
        style={{ color: valueColor || '#F0EBE0' }}
      >
        {value}
      </p>
      {sub && (
        <p className="text-[11px] text-kayan-sub mt-1">{sub}</p>
      )}
    </div>
  )
}
