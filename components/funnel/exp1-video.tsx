"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { versionAsset } from "./asset-version"
import { FunnelLanding } from "./funnel-landing"

const INTRO_VIDEO_SRC = versionAsset("/videos/veyra-llamando-final.mp4")

type Exp1VideoProps = {
  onStart: () => void
  onComplete: () => void
  startIntroAudio: () => void
}

function warnPlaybackFailure(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[funnel] EXP 1 video playback failed", error)
  }
}

export function Exp1Video({
  onStart,
  onComplete,
  startIntroAudio,
}: Exp1VideoProps) {
  const done = useRef(false)
  const startLocked = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    video.pause()
    video.currentTime = 0
  }, [])

  const handleStart = useCallback(() => {
    if (startLocked.current) return
    startLocked.current = true

    startIntroAudio()

    const video = videoRef.current
    if (video) {
      try {
        video.currentTime = 0
        void video.play().catch((error: unknown) => {
          warnPlaybackFailure(error)
        })
      } catch (error) {
        warnPlaybackFailure(error)
      }
    }

    setStarted(true)
    onStart()
  }, [onStart, startIntroAudio])

  const handleEnded = useCallback(() => {
    if (done.current) return

    done.current = true
    onComplete()
  }, [onComplete])

  return (
    <section className="relative flex min-h-screen w-full min-w-[320px] justify-center overflow-hidden bg-mystic">
      <div className="relative min-h-screen w-full max-w-[460px] overflow-hidden bg-black shadow-[0_0_80px_oklch(0.13_0.03_295_/_0.8)] md:border-x md:border-gold/10">
        <video
          ref={videoRef}
          src={INTRO_VIDEO_SRC}
          muted
          playsInline
          preload="auto"
          controls={false}
          onEnded={handleEnded}
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden="true"
        />

        <div className="pointer-events-none absolute inset-0 bg-black/10" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_70%_at_50%_45%,transparent_35%,oklch(0.05_0.02_295/0.6)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/55 to-transparent" />

        <div
          className={`absolute inset-0 z-20 break-words transition-opacity duration-700 ease-out ${
            started ? "pointer-events-none opacity-0" : "opacity-100"
          }`}
        >
          <FunnelLanding onStart={handleStart} />
        </div>
      </div>
    </section>
  )
}
