"use client"

import { funnelConfig } from "./config"
import { VslVideoPlayer } from "./video-player/vsl-video-player"

const VSL_CONFIG = {
  bunnyVideoUrl: funnelConfig.vslVideoUrl,
  simulatedDurationSeconds: 900,
}

export function VslInterlude({ onComplete }: { onComplete: () => void }) {
  return (
    <section className="relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden bg-black text-white">
      <VslVideoPlayer
        src={VSL_CONFIG.bunnyVideoUrl}
        title="Mensaje privado de Janny"
        simulatedDurationSeconds={VSL_CONFIG.simulatedDurationSeconds}
        autoPlay
        blockUserInteraction
        fullScreen
        onEnded={onComplete}
        className="absolute inset-0 h-full w-full"
      />
    </section>
  )
}
