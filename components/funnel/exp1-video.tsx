"use client"

import { useEffect, useRef, useState } from "react"
import { Play, PhoneCall } from "lucide-react"
import { VeyraOrb } from "./veyra-orb"
import { Particles } from "./particles"

const DURATION = 12 // seconds

export function Exp1Video({ onComplete }: { onComplete: () => void }) {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const raf = useRef<number | null>(null)
  const start = useRef<number>(0)

  useEffect(() => {
    if (!playing) return
    start.current = performance.now()
    const tick = (now: number) => {
      const e = (now - start.current) / 1000
      setElapsed(e)
      if (e >= DURATION) {
        setElapsed(DURATION)
        setTimeout(onComplete, 600)
        return
      }
      raf.current = requestAnimationFrame(tick)
    }
    raf.current = requestAnimationFrame(tick)
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current)
    }
  }, [playing, onComplete])

  const progress = Math.min(elapsed / DURATION, 1) * 100
  const showText = elapsed >= 5 && elapsed < 8
  const showCall = elapsed >= 8

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5">
      <Particles count={28} />

      {/* Stage visuals */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center">
        <VeyraOrb size={220} active={playing} className="mb-8" />

        {showText && (
          <p className="animate-float-up max-w-xs text-balance text-center font-serif text-2xl leading-relaxed text-glow break-words">
            Hay una señal emocional activa.
          </p>
        )}

        {showCall && (
          <div className="animate-float-up flex flex-col items-center gap-2">
            <span className="text-sm uppercase tracking-[0.3em] text-muted-foreground">
              Llamada entrante…
            </span>
            <span className="font-serif text-4xl tracking-wide text-gold">
              VEYRA
            </span>
            <PhoneCall className="mt-3 size-8 animate-soft-blink text-primary" />
          </div>
        )}
      </div>

      {/* Play button */}
      {!playing && (
        <button
          onClick={() => setPlaying(true)}
          aria-label="Reproducir"
          className="absolute inset-0 z-20 flex items-center justify-center bg-background/30 backdrop-blur-sm"
        >
          <span className="flex size-20 items-center justify-center rounded-full bg-primary/90 glow-violet transition-transform hover:scale-105">
            <Play className="size-9 translate-x-0.5 fill-primary-foreground text-primary-foreground" />
          </span>
        </button>
      )}

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 z-10 h-1 w-full bg-white/10">
        <div
          className="h-full bg-gradient-to-r from-primary to-gold transition-[width] duration-100"
          style={{ width: `${progress}%` }}
        />
      </div>
    </section>
  )
}
