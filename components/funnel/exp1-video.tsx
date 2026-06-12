"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { FunnelLanding } from "./funnel-landing"

const YT_ID = "qHvLv7pj5LE"
const INTRO_AUDIO_SRC = "/audio/intro-rings.mp3"
// The first scene plays the background video for this long, then advances.
const SCENE_DURATION = 10_000

type Exp1VideoProps = {
  onStart: () => void
  onComplete: () => void
}

function warnPlaybackFailure(target: "audio", error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[funnel] EXP 1 ${target} playback failed`, error)
  }
}

function buildYoutubeSrc() {
  const params = new URLSearchParams({
    autoplay: "1",
    mute: "1",
    controls: "0",
    rel: "0",
    playsinline: "1",
    disablekb: "1",
    fs: "0",
    iv_load_policy: "3",
    modestbranding: "1",
    loop: "1",
    playlist: YT_ID,
  })

  return `https://www.youtube.com/embed/${YT_ID}?${params.toString()}`
}

export function Exp1Video({ onStart, onComplete }: Exp1VideoProps) {
  const done = useRef(false)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [started, setStarted] = useState(false)

  useEffect(() => {
    if (!started) return

    const t = setTimeout(() => {
      if (!done.current) {
        done.current = true
        onComplete()
      }
    }, SCENE_DURATION)
    return () => clearTimeout(t)
  }, [onComplete, started])

  const handleStart = useCallback(() => {
    if (started) return

    const audio = audioRef.current
    if (audio) {
      try {
        audio.currentTime = 0
        audio.volume = 1
        void audio.play().catch((error: unknown) => {
          warnPlaybackFailure("audio", error)
        })
      } catch (error) {
        warnPlaybackFailure("audio", error)
      }
    }

    setStarted(true)
    onStart()
  }, [onStart, started])

  return (
    <section className="relative min-h-screen w-full overflow-hidden bg-black">
      <audio ref={audioRef} src={INTRO_AUDIO_SRC} preload="auto" />

      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <iframe
          className="absolute left-1/2 top-1/2 min-h-full min-w-full -translate-x-1/2 -translate-y-1/2 border-0"
          style={{
            width: "max(100vw, calc(100vh * 9 / 16))",
            height: "max(100vh, calc(100vw * 16 / 9))",
          }}
          src={buildYoutubeSrc()}
          title="Veyra llamando"
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          loading="eager"
          referrerPolicy="strict-origin-when-cross-origin"
          aria-hidden="true"
        />
      </div>

      <div className="pointer-events-none absolute inset-0 bg-black/10" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_70%_at_50%_45%,transparent_35%,oklch(0.05_0.02_295/0.6)_100%)]" />
      <div className="pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-black/45 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black/55 to-transparent" />

      {!started && <FunnelLanding onStart={handleStart} />}
    </section>
  )
}
