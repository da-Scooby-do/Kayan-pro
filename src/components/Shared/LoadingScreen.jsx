import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

/**
 * LoadingScreen — pure CSS, no heavy image loads.
 * The SVG backgrounds are deferred to the login page AFTER this unmounts.
 */
export default function LoadingScreen({ onDone, duration = 2600 }) {
    const [exiting, setExiting] = useState(false)

    useEffect(() => {
        const t1 = setTimeout(() => setExiting(true), duration - 500)
        const t2 = setTimeout(() => onDone?.(), duration)
        return () => { clearTimeout(t1); clearTimeout(t2) }
    }, [duration, onDone])

    return (
        <AnimatePresence>
            {!exiting && (
                <motion.div
                    key="splash"
                    initial={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.5 }}
                    className="fixed inset-0 z-[99999] flex items-center justify-center"
                    style={{
                        background: 'radial-gradient(ellipse 80% 80% at 50% 50%, #0D0B08 0%, #07070E 100%)',
                    }}
                >
                    {/* Subtle gold radial glow — no image load */}
                    <div
                        className="absolute inset-0 pointer-events-none"
                        style={{
                            background: `
                radial-gradient(ellipse 55% 55% at 50% 50%,
                  rgba(201,168,76,0.07) 0%, transparent 70%)
              `,
                        }}
                    />

                    {/* Decorative rings */}
                    {[480, 320, 180].map((sz, i) => (
                        <motion.div
                            key={sz}
                            initial={{ opacity: 0, scale: 0.85 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.1 + i * 0.12, duration: 0.7 }}
                            className="absolute rounded-full pointer-events-none"
                            style={{
                                width: sz, height: sz,
                                border: `1px solid rgba(201,168,76,${0.06 - i * 0.015})`,
                            }}
                        />
                    ))}

                    {/* Center */}
                    <div className="relative z-10 flex flex-col items-center">

                        {/* Logo */}
                        <motion.div
                            initial={{ scale: 0.65, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                            style={{ filter: 'drop-shadow(0 0 28px rgba(201,168,76,0.35))' }}
                            className="mb-5"
                        >
                            <img
                                src="/kayan-logo.png"
                                alt="Kayan"
                                width={96}
                                height={96}
                                className="rounded-full object-cover"
                                style={{ width: 96, height: 96 }}
                            />
                        </motion.div>

                        {/* Arabic name */}
                        <motion.h1
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.55, delay: 0.3 }}
                            className="font-display font-bold leading-none mb-2"
                            style={{
                                fontSize: 'clamp(68px, 16vw, 104px)',
                                background: 'linear-gradient(145deg, #EFC95A 0%, #C9A84C 55%, #A8843A 100%)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                backgroundClip: 'text',
                            }}
                        >
                            كيان
                        </motion.h1>

                        {/* KAYAN */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.55 }}
                            className="tracking-[10px] text-sm uppercase font-light"
                            style={{ color: 'rgba(201,168,76,0.45)' }}
                        >
                            K A Y A N
                        </motion.p>

                        {/* Tagline */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ duration: 0.5, delay: 0.75 }}
                            className="text-[10px] tracking-[3px] uppercase mt-2"
                            style={{ color: 'rgba(255,255,255,0.22)' }}
                        >
                            Work Space & Café · Alexandria
                        </motion.p>

                        {/* Dots */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 1.0 }}
                            className="flex gap-2 mt-7"
                        >
                            {[0, 1, 2].map(i => (
                                <motion.span
                                    key={i}
                                    animate={{ opacity: [0.2, 1, 0.2], scale: [0.7, 1.2, 0.7] }}
                                    transition={{ duration: 1.1, repeat: Infinity, delay: i * 0.2 }}
                                    className="inline-block w-1.5 h-1.5 rounded-full"
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