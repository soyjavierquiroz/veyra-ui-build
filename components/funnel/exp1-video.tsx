"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { funnelConfig } from "./config"
import { FunnelLanding } from "./funnel-landing"

const YT_ID = "CUc-yP8aGiU"
const INTRO_AUDIO_SRC = "/audio/intro-rings.mp3"
// The first scene plays the background video for this long, then advances.
const SCENE_DURATION = 10_000

type Exp1VideoProps = {
  onStart: () => void
  onComplete: () => void
}

function warnPlaybackFailure(target: "video" | "audio", error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[funnel] EXP 1 ${target} playback failed`, error)
  }
}

function buildYoutubeSrc(started: boolean) {
  const params = new URLSearchParams({
    autoplay: started ? "1" : "0",
    mute: "1",
    loop: "1",
    playlist: YT_ID,
    controls: "0",
    playsinline: "1",
    rel: "0",
    modestbranding: "1",
    showinfo: "0",
    iv_load_policy: "3",
    disablekb: "1",
    fs: "0",
  })

  return `https://www.youtube.com/embed/${YT_ID}?${params.toString()}`
}

export function Exp1Video({ onStart, onComplete }: Exp1VideoProps) {
  const done = useRef(false)
  const videoRef = useRef<HTMLVideoElement>(null)
  const audioRef = useRef<HTMLAudioElement>(null)
  const [started, setStarted] = useState(false)
  const html5VideoUrl = funnelConfig.exp1VideoUrl

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

    const video = videoRef.current
    if (video) {
      try {
        video.currentTime = 0
        video.muted = true
        void video.play().catch((error: unknown) => {
          warnPlaybackFailure("video", error)
        })
      } catch (error) {
        warnPlaybackFailure("video", error)
      }
    }

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

      {/* Full-screen muted background video. If an MP4 URL is supplied later,
          the HTML5 branch starts from the same user gesture as the audio. */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {html5VideoUrl ? (
          <video
            ref={videoRef}
            className="absolute inset-0 h-full w-full object-cover"
            src={html5VideoUrl}
            muted
            playsInline
            preload="auto"
            controls={false}
            loop={false}
          />
        ) : (
          <iframe
            className="absolute left-1/2 top-1/2 h-[100vh] w-[177.78vh] min-w-full -translate-x-1/2 -translate-y-1/2"
            src={buildYoutubeSrc(started)}
            title="La consciencia de sanar"
            frameBorder="0"
            allow="autoplay; encrypted-media; picture-in-picture"
            loading="eager"
            referrerPolicy="strict-origin-when-cross-origin"
          />
        )}
      </div>

      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(75%_70%_at_50%_45%,transparent_35%,oklch(0.05_0.02_295/0.6)_100%)]" />

      {!started && <FunnelLanding onStart={handleStart} />}
    </section>
  )
}
