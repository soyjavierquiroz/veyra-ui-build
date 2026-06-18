"use client"

import { funnelConfig } from "./config"
import { VslVideoPlayer } from "./video-player/vsl-video-player"

const VSL_CONFIG = {
  simulatedDurationSeconds: 900,
}

export function VslInterlude({ onComplete }: { onComplete: () => void }) {
  return (
    <section className="funnel-stage text-white">
      <div className="funnel-mobile-shell shadow-[0_0_80px_oklch(0.13_0.03_295_/_0.8)] md:border-x md:border-gold/10">
        <VslVideoPlayer
          src={funnelConfig.vslVideoUrl}
          title="Mensaje privado de Janny"
          simulatedDurationSeconds={VSL_CONFIG.simulatedDurationSeconds}
          autoPlay
          blockUserInteraction
          fullScreen
          onEnded={onComplete}
          className="absolute inset-0 h-full w-full"
        />
      </div>
    </section>
  )
}
