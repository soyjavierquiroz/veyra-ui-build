"use client"

import { ArrowRight } from "lucide-react"
import { funnelConfig } from "./config"
import { Particles } from "./particles"
import { VslVideoPlayer } from "./video-player/vsl-video-player"

const VSL_CONFIG = {
  bunnyVideoUrl: funnelConfig.vslVideoUrl,
  simulatedDurationSeconds: 900,
}

export function VslInterlude({ onComplete }: { onComplete: () => void }) {
  const hasVideo = VSL_CONFIG.bunnyVideoUrl.length > 0

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-4 py-8">
      <Particles count={18} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,oklch(0.62_0.18_300/0.36),transparent_36%),linear-gradient(180deg,oklch(0.16_0.04_300),oklch(0.08_0.02_300)_54%,black)]" />

      <div className="relative z-10 flex w-full max-w-sm flex-1 flex-col items-center justify-center">
        <div className="mb-5 text-center">
          <p className="mb-2 text-xs uppercase tracking-[0.28em] text-muted-foreground">
            EXP 7
          </p>
          <h1 className="font-serif text-3xl leading-tight text-gold text-balance">
            Mensaje privado de Janny
          </h1>
        </div>

        <VslVideoPlayer
          src={VSL_CONFIG.bunnyVideoUrl}
          title="Mensaje privado de Janny"
          simulatedDurationSeconds={VSL_CONFIG.simulatedDurationSeconds}
          autoPlay
          blockUserInteraction
          onEnded={onComplete}
          className="max-h-[72vh]"
        />

        {!hasVideo ? (
          <button
            type="button"
            onClick={onComplete}
            className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
          >
            Continuar
            <ArrowRight className="size-5" />
          </button>
        ) : null}
      </div>
    </section>
  )
}
