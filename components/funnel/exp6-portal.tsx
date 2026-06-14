"use client"

import { useEffect, useState } from "react"
import { ArrowRight, DoorOpen } from "lucide-react"
import { Particles } from "./particles"

const STEPS = [
  "Patrón dominante revelado.",
  "Guía humana asignada: Janny Helguero.",
  "Veyra reveló.\nJanny ordena.",
]

const TOTAL = 8000

export function Exp6Portal({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const [step, setStep] = useState(0)

  useEffect(() => {
    const startedAt = performance.now()
    let raf = 0
    const tick = (now: number) => {
      const p = Math.min((now - startedAt) / TOTAL, 1)
      setProgress(p * 100)
      if (p < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)

    const timers = STEPS.map((_, i) =>
      setTimeout(() => setStep(i + 1), (i + 1) * 2000),
    )
    return () => {
      cancelAnimationFrame(raf)
      timers.forEach(clearTimeout)
    }
  }, [])

  const done = progress >= 100

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
      <Particles count={26} />

      {/* Luminous door */}
      <div className="relative z-10 mb-10 flex items-center justify-center">
        <div
          className="absolute size-64 rounded-full blur-3xl animate-mystic-pulse"
          style={{
            background:
              "radial-gradient(circle, oklch(0.62 0.18 300 / 0.7), transparent 70%)",
          }}
          aria-hidden="true"
        />
        <div className="relative flex size-44 items-center justify-center rounded-full border border-gold/50 glow-gold">
          <div className="flex size-32 items-center justify-center rounded-full border border-primary/60 bg-card/40 backdrop-blur animate-halo-spin">
            <DoorOpen className="size-12 text-gold" />
          </div>
        </div>
      </div>

      <div className="relative z-10 flex w-full max-w-md flex-col items-center text-center">
        <h1 className="mb-8 font-serif text-3xl leading-tight text-gold text-balance">
          Portal Privado de Lectura Revelada
        </h1>

        <div className="mb-8 min-h-[140px] space-y-3">
          {STEPS.slice(0, step).map((t, i) => (
            <div key={i} className="animate-float-up">
              {t.split("\n").map((line) => (
                <p
                  key={line}
                  className={`break-words ${
                    i >= 2 ? "font-serif text-xl text-gold" : "text-foreground/90"
                  }`}
                >
                  {line}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Progress */}
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-primary to-gold"
            style={{ width: `${progress}%` }}
          />
        </div>

        {done && (
          <button
            onClick={onComplete}
            className="animate-float-up flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
          >
            VER MENSAJE DE JANNY
            <ArrowRight className="size-5" />
          </button>
        )}
      </div>
    </section>
  )
}
