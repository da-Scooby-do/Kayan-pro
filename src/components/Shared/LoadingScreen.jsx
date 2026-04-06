import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * LoadingScreen
 * Shows the Kayan branded splash for `duration` ms,
 * then calls onDone() so the parent unmounts it.
 *
 * Uses kayan-bg-mobile.svg  on screens < 768px
 * Uses kayan-bg-desktop.svg on screens ≥ 768px
 */
export default function LoadingScreen({ onDone, duration = 2800 }) {
    const [phase, setPhase] = useState('enter') // enter → hold → exit

    useEffect(() => {
        const holdTimer = setTimeout(() => setPhase('exit'), duration - 600)
        const doneTimer = setTimeout(() => onDone?.(), duration)
        return () => { clearTimeout(holdTimer); clearTimeout(doneTimer) }
    }, [duration, onDone])

    return (
        <AnimatePresence>
            {phase !== 'done' && (
                <motion.div
                    key="loading"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.6, ease: 'easeInOut' }}
                    onAnimationComplete={() => { if (phase === 'exit') setPhase('done') }}
                    className="fixed inset-0 z-[99999] overflow-hidden flex items-center justify-center"
                    style={{ background: '#07070E' }}
                >
                    {/* ── Background image — responsive ── */}
                    {/* Mobile: portrait SVG */}
                    <div
                        className="absolute inset-0 md:hidden"
                        style={{
                            backgroundImage: 'url(/kayan-bg-mobile.svg)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            opacity: 0.18,
                        }}
                    />
                    {/* Desktop: landscape SVG */}
                    <div
                        className="absolute inset-0 hidden md:block"
                        style={{
                            backgroundImage: 'url(/kayan-bg-desktop.svg)',
                            backgroundSize: 'cover',
                            backgroundPosition: 'center center',
                            backgroundRepeat: 'no-repeat',
                            opacity: 0.18,
                        }}
                    />

                    {/* ── Dark overlay gradient ── */}
                    <div className="absolute inset-0"
                        style={{
                            background: `
                radial-gradient(ellipse 70% 70% at 50% 50%, rgba(7,7,14,0.35) 0%, rgba(7,7,14,0.85) 100%)
              `
                        }}
                    />

                    {/* ── Center content ── */}
                    <div className="relative z-10 flex flex-col items-center text-center px-6">

                        {/* Logo image */}
                        <motion.div
                            initial={{ scale: 0.7, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                            className="mb-6"
                            style={{ filter: 'drop-shadow(0 0 32px rgba(201,168,76,0.4))' }}
                        >
                            <img
                                src="/kayan-logo.png"
                                alt="Kayan"
                                className="rounded-full object-cover"
                                style={{ width: 100, height: 100 }}
                            />
                        </motion.div>

                        {/* Arabic name */}
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.35 }}
                            className="font-display font-bold leading-none mb-2"
                            style={{
                                fontSize: 'clamp(72px, 14vw, 110px)',
                                background: 'linear-gradient(135deg, #EFC95A 0%, #C9A84C 50%, #A8843A 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                            }}
                        >
                            كيان
                        </motion.h1>

                        {/* Latin subtitle */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.6 }}
                            className="tracking-[10px] text-sm uppercase font-light"
                            style={{ color: 'rgba(201,168,76,0.5)' }}
                        >
                            K A Y A N
                        </motion.p>

                        {/* Tagline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.85 }}
                            className="text-[10px] tracking-[4px] uppercase mt-3"
                            style={{ color: 'rgba(255,255,255,0.25)' }}
                        >
                            Work Space & Café · Alexandria
                        </motion.p>

                        {/* Loading dots */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.1 }}
                            className="flex gap-2 mt-8"
                        >
                            {[0, 1, 2].map(i => (
                                <motion.div
                                    key={i}
                                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.8, 1.2, 0.8] }}
                                    transition={{
                                        duration: 1.2,
                                        repeat: Infinity,
                                        delay: i * 0.18,
                                        ease: 'easeInOut',
                                    }}
                                    className="w-1.5 h-1.5 rounded-full"
                                    style={{ background: '#C9A84C' }}
                                />
                            ))}
                        </motion.div>

                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    )
}