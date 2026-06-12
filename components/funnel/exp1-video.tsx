"use client"

import { useEffect, useRef, useState } from "react"
import { Play, PhoneCall, ArrowRight } from "lucide-react"
import { VeyraOrb } from "./veyra-orb"
import { Particles } from "./particles"

const YT_ID = "CUc-yP8aGiU"
// Time (s) after pressing play before the "continue" path is offered.
const REVEAL_AT = 6

export function Exp1Video({ onComplete }: { onComplete: () => void }) {
  const [playing, setPlaying] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const timer = useRef<ReturnType<typeof setInterval> | null>(null)

  useEffect(() => {
    if (!playing) return
    timer.current = setInterval(() => {
      setElapsed((e) => e + 1)
    }, 1000)
    return () => {
      if (timer.current) clearInterval(timer.current)
    }
  }, [playing])

  const showSignal = playing && elapsed >= REVEAL_AT

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-5 py-10">
      <Particles count={24} />

      <div className="relative z-10 flex w-full max-w-sm flex-col items-center">
        <p className="mb-5 text-center text-xs uppercase tracking-[0.35em] text-muted-foreground">
          Antes de escribirle…
        </p>

        {/* Vertical 9:16 video frame */}
        <div className="relative w-full max-w-[300px] overflow-hidden rounded-[1.75rem] border border-primary/30 glow-violet">
          <div className="relative aspect-[9/16] w-full bg-black">
            {playing ? (
              <iframe
                className="absolute inset-0 h-full w-full"
                src={`https://www.youtube.com/embed/${YT_ID}?autoplay=1&playsinline=1&rel=0&modestbranding=1`}
                title="La consciencia de sanar"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                referrerPolicy="strict-origin-when-cross-origin"
                allowFullScreen
              />
            ) : (
              <button
                onClick={() => setPlaying(true)}
                aria-label="Reproducir video"
                className="group absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-b from-primary/20 via-background/40 to-background/80"
              >
                <VeyraOrb size={120} active={false} />
                <span className="flex size-16 items-center justify-center rounded-full bg-primary/90 glow-violet transition-transform group-hover:scale-105">
                  <Play className="size-7 translate-x-0.5 fill-primary-foreground text-primary-foreground" />
                </span>
                <span className="font-serif text-lg text-glow">
                  La consciencia de sanar
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Signal + advance */}
        {showSignal ? (
          <div className="animate-float-up mt-8 flex flex-col items-center gap-3 text-center">
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Hay una señal emocional activa
            </span>
            <span className="flex items-center gap-2 font-serif text-3xl tracking-wide text-gold">
              <PhoneCall className="size-6 animate-soft-blink text-primary" />
              VEYRA
            </span>
            <button
              onClick={onComplete}
              className="mt-2 flex items-center gap-2 rounded-full bg-primary px-7 py-3 text-sm font-medium uppercase tracking-wider text-primary-foreground glow-violet transition-transform hover:scale-[1.03]"
            >
              Recibir la llamada
              <ArrowRight className="size-4" />
            </button>
          </div>
        ) : (
          playing && (
            <p className="animate-soft-blink mt-8 text-center text-sm text-muted-foreground">
              Respira mientras escuchas…
            </p>
          )
        )}
      </div>
    </section>
  )
}
