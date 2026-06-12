"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Play, ArrowRight, Loader2 } from "lucide-react"

type State = "cover" | "loading" | "playing" | "ended"

const DURATION = 12

export function VslInterlude({ onComplete }: { onComplete: () => void }) {
  const [state, setState] = useState<State>("cover")
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    if (state === "loading") {
      const t = setTimeout(() => setState("playing"), 1400)
      return () => clearTimeout(t)
    }
    if (state === "playing") {
      const id = setInterval(() => {
        setElapsed((e) => {
          if (e >= DURATION) {
            clearInterval(id)
            setState("ended")
            return DURATION
          }
          return e + 0.1
        })
      }, 100)
      return () => clearInterval(id)
    }
  }, [state])

  const progress = Math.min(elapsed / DURATION, 1) * 100

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <p className="mb-4 text-center text-xs uppercase tracking-[0.3em] text-muted-foreground">
          Mensaje de
        </p>
        <h1 className="mb-6 text-center font-serif text-3xl text-gold">
          Janny Helguero
        </h1>

        {/* Vertical player */}
        <div className="relative mx-auto aspect-[9/16] w-full overflow-hidden rounded-3xl border border-gold/30 bg-card glow-gold">
          <Image
            src="/janny-portrait.png"
            alt="Retrato de Janny Helguero"
            fill
            className={`object-cover transition-all duration-700 ${
              state === "playing" ? "scale-105 brightness-90" : "brightness-75"
            }`}
            priority
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/90 via-background/20 to-background/40" />

          {/* Cover play */}
          {state === "cover" && (
            <button
              onClick={() => setState("loading")}
              aria-label="Reproducir mensaje"
              className="absolute inset-0 flex items-center justify-center"
            >
              <span className="flex size-20 items-center justify-center rounded-full bg-primary/90 glow-violet transition-transform hover:scale-105">
                <Play className="size-9 translate-x-0.5 fill-primary-foreground text-primary-foreground" />
              </span>
            </button>
          )}

          {state === "loading" && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
              <Loader2 className="size-10 animate-spin text-gold" />
              <span className="text-sm text-muted-foreground">Cargando…</span>
            </div>
          )}

          {state === "ended" && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-sm">
              <span className="font-serif text-xl text-gold">
                Janny Helguero
              </span>
            </div>
          )}

          {/* Progress */}
          {(state === "playing" || state === "ended") && (
            <div className="absolute bottom-0 left-0 h-1 w-full bg-white/15">
              <div
                className="h-full bg-gradient-to-r from-primary to-gold"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>

        {/* CTA after end */}
        <div className="mt-6 min-h-[60px]">
          {state === "ended" && (
            <button
              onClick={onComplete}
              className="animate-float-up flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
            >
              Continuar
              <ArrowRight className="size-5" />
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
