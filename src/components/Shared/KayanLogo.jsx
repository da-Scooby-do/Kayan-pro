/**
 * KayanLogo — Reusable brand logo component
 *
 * Usage:
 *   <KayanLogo size="md" />          — text logo (default, lightweight)
 *   <KayanLogo size="lg" showImage /> — with actual logo image
 *   <KayanLogo size="sm" />          — compact for headers
 */
export default function KayanLogo({
  size = 'md',
  showImage = false,
  showTagline = true,
  className = '',
}) {
  const sizes = {
    sm: { arabic: 'text-xl',  latin: 'text-[7px]',  tagline: 'text-[7px]',  img: 32 },
    md: { arabic: 'text-2xl', latin: 'text-[8px]',  tagline: 'text-[8px]',  img: 44 },
    lg: { arabic: 'text-4xl', latin: 'text-[10px]', tagline: 'text-[9px]',  img: 64 },
    xl: { arabic: 'text-6xl', latin: 'text-sm',     tagline: 'text-[11px]', img: 96 },
  }

  const s = sizes[size] ?? sizes.md

  if (showImage) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <img
          src="/kayan-logo.png"
          alt="Kayan Logo"
          width={s.img}
          height={s.img}
          className="rounded-full object-cover flex-shrink-0"
          style={{
            filter: 'drop-shadow(0 0 8px rgba(201,168,76,0.25))',
          }}
        />
        <div>
          <h1 className={`gold-text font-display font-bold leading-none block ${s.arabic}`}>
            كيان
          </h1>
          <p className={`tracking-[4px] text-kayan-gold/40 uppercase ${s.latin}`}>
            KAYAN
          </p>
          {showTagline && (
            <p className={`text-kayan-muted tracking-wide ${s.tagline}`}>
              Work Space & Café · Alexandria
            </p>
          )}
        </div>
      </div>
    )
  }

  // Text-only version (default — lightweight, no image request)
  return (
    <div className={className}>
      <h1 className={`gold-text font-display font-bold leading-none block ${s.arabic}`}>
        كيان
      </h1>
      <p className={`tracking-[4px] text-kayan-gold/40 uppercase ${s.latin}`}>
        KAYAN
      </p>
      {showTagline && (
        <p className={`text-kayan-muted ${s.tagline}`}>
          Work Space & Café
        </p>
      )}
    </div>
  )
}