"use client"

import { useEffect, useRef, useState } from "react"
import { PhoneCall, ArrowRight } from "lucide-react"
import { Particles } from "./particles"

const YT_ID = "CUc-yP8aGiU"
// Time (s) after the experience begins before the "continue" path is offered.
const REVEAL_AT = 6

export function Exp1Video({ onComplete }: { onComplete: () => void }) {
  const [elapsed, setElapsed] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    timer.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [])

  const showSignal = elapsed >= REVEAL_AT

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-end overflow-hidden">
      {/* Full-screen muted, autoplaying background video */}
      <div className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-black">
        <iframe
          className="absolute left-1/2 top-1/2 h-[100vh] w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
          src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&mute=1&loop=1&playlist=${YT_ID}&controls=0&playsinline=1&rel=0&modestbranding=1&showinfo=0&iv_load_policy=3`}
          title="La consciencia de sanar"
          frameBorder="0"
          allow="autoplay; encrypted-media; picture-in-picture"
          referrerPolicy="strict-origin-when-cross-origin"
        />
      </div>

      {/* Darkening + mystical gradient overlays for legibility */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-background/70 via-background/30 to-background/95" />
      <div className="absolute inset-0 z-10 bg-[radial-gradient(70%_60%_at_50%_40%,transparent_30%,oklch(0.13_0.03_295/0.55)_100%)]" />
      <Particles count={20} />

      {/* Top label */}
      <p className="absolute top-10 left-1/2 z-20 -translate-x-1/2 text-center text-xs uppercase tracking-[0.4em] text-foreground/70">
        Antes de escribirle…
      </p>

      {/* Bottom overlay content */}
      <div className="relative z-20 flex w-full max-w-sm flex-col items-center px-5 pb-16 text-center">
        {showSignal ? (
          <div className="animate-float-up flex flex-col items-center gap-3">
            <span className="text-xs uppercase tracking-[0.3em] text-foreground/70">
              Hay una señal emocional activa
            </span>
            <span className="flex items-center gap-2 font-serif text-3xl tracking-wide text-gold text-glow">
              <PhoneCall className="size-6 animate-soft-blink text-primary" />
              VEYRA
            </span>
            <button
              onClick={onComplete}
              className="mt-3 flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium uppercase tracking-wider text-primary-foreground glow-violet transition-transform hover:scale-[1.03]"
            >
              Recibir la llamada
              <ArrowRight className="size-4" />
            </button>
          </div>
        ) : (
          <p className="animate-soft-blink font-serif text-2xl text-foreground/85 text-glow">
            Respira mientras escuchas…
          </p>
        )}
      </div>
    </section>
  )
}
