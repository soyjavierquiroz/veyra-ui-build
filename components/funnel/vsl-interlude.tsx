"use client"

import { funnelConfig } from "./config"
import { VslVideoPlayer } from "./video-player/vsl-video-player"
import { YouTubeShortsVslPlayer } from "./video-player/youtube-shorts-vsl-player"

const VSL_CONFIG = {
  simulatedDurationSeconds: 900,
}

export function VslInterlude({ onComplete }: { onComplete: () => void }) {
  return (
    <section className="flex min-h-[100dvh] w-full justify-center overflow-hidden bg-black text-white">
      <div className="relative h-[100dvh] min-h-[100dvh] w-full max-w-[460px] overflow-hidden bg-black">
        {funnelConfig.vslProvider === "youtube" ? (
          <YouTubeShortsVslPlayer
            videoUrl={funnelConfig.vslYoutubeUrl}
            autoPlay
            startWithSound
            blockUserInteraction
            simulatedDurationSeconds={VSL_CONFIG.simulatedDurationSeconds}
            cleanMode={funnelConfig.youtubeCleanMode}
            iframeScale={funnelConfig.youtubeIframeScale}
            maskTop={funnelConfig.youtubeMaskTop}
            maskBottom={funnelConfig.youtubeMaskBottom}
            maskLeft={funnelConfig.youtubeMaskLeft}
            maskRight={funnelConfig.youtubeMaskRight}
            onEnded={onComplete}
            className="absolute inset-0 h-full w-full"
          />
        ) : (
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
        )}
      </div>
    </section>
  )
}
