export default function Avatar({ initial, size = 40, className = '' }) {
  const style = {
    width:  size,
    height: size,
    fontSize: size * 0.38,
  }
  return (
    <div
      className={`rounded-full flex-shrink-0 flex items-center justify-center
        font-bold text-kayan-gold
        bg-gradient-to-br from-kayan-gold/25 to-kayan-gold/[0.07]
        border border-kayan-border ${className}`}
      style={style}
    >
      {initial}
    </div>
  )
}
