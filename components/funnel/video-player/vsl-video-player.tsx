"use client"

import Hls from "hls.js"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"

export type VslVideoPlayerProps = {
  src: string
  title?: string
  simulatedDurationSeconds?: number
  autoPlay?: boolean
  blockUserInteraction?: boolean
  fullScreen?: boolean
  className?: string
  onEnded?: () => void
  onPlaybackBlocked?: () => void
}

const DEFAULT_SIMULATED_DURATION = 900
const PROGRESS_CAP = 98
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getPsychologicalProgress(elapsedSeconds: number, durationSeconds: number) {
  const safeElapsed = Number.isFinite(elapsedSeconds)
    ? Math.max(elapsedSeconds, 0)
    : 0
  const safeDuration = durationSeconds > 0 ? durationSeconds : DEFAULT_SIMULATED_DURATION
  const normalized = clamp(safeElapsed / safeDuration, 0, 1)

  if (safeElapsed <= 20) {
    return clamp((safeElapsed / 20) * 30, 0, PROGRESS_CAP)
  }

  if (normalized <= 0.5) {
    const middleDuration = Math.max(safeDuration * 0.5 - 20, 1)
    return clamp(30 + ((safeElapsed - 20) / middleDuration) * 40, 0, PROGRESS_CAP)
  }

  const finalDuration = Math.max(safeDuration * 0.5, 1)
  return clamp(
    70 + ((safeElapsed - safeDuration * 0.5) / finalDuration) * 28,
    0,
    PROGRESS_CAP,
  )
}

function isLikelyHlsUrl(src: string) {
  return src.toLowerCase().includes(".m3u8")
}

export function VslVideoPlayer({
  src,
  title = "Mensaje privado de Janny",
  simulatedDurationSeconds = DEFAULT_SIMULATED_DURATION,
  autoPlay = true,
  blockUserInteraction = true,
  fullScreen = false,
  className,
  onEnded,
  onPlaybackBlocked,
}: VslVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const progressRafRef = useRef<number | null>(null)
  const progressStartedAtRef = useRef<number | null>(null)
  const accumulatedProgressMsRef = useRef(0)
  const attemptedAutoplayRef = useRef(false)
  const [playbackState, setPlaybackState] = useState<
    "idle" | "playing" | "blocked" | "ended"
  >("idle")
  const [progress, setProgress] = useState(0)
  const hasSource = src.trim().length > 0

  const stopProgressLoop = useCallback(() => {
    if (progressRafRef.current !== null) {
      cancelAnimationFrame(progressRafRef.current)
      progressRafRef.current = null
    }

    if (progressStartedAtRef.current !== null) {
      accumulatedProgressMsRef.current +=
        performance.now() - progressStartedAtRef.current
      progressStartedAtRef.current = null
    }
  }, [])

  const startProgressLoop = useCallback(() => {
    stopProgressLoop()
    progressStartedAtRef.current = performance.now()

    const tick = () => {
      const startedAt = progressStartedAtRef.current
      const liveMs = startedAt ? performance.now() - startedAt : 0
      const elapsedSeconds = (accumulatedProgressMsRef.current + liveMs) / 1000

      setProgress(
        getPsychologicalProgress(elapsedSeconds, simulatedDurationSeconds),
      )
      progressRafRef.current = requestAnimationFrame(tick)
    }

    progressRafRef.current = requestAnimationFrame(tick)
  }, [simulatedDurationSeconds, stopProgressLoop])

  const requestPlayback = useCallback(async () => {
    const video = videoRef.current
    if (!video || !hasSource) return

    try {
      video.muted = false
      video.controls = false
      await video.play()
      setPlaybackState("playing")
    } catch {
      setPlaybackState("blocked")
      onPlaybackBlocked?.()
      stopProgressLoop()
    }
  }, [hasSource, onPlaybackBlocked, stopProgressLoop])

  useBrowserLayoutEffect(() => {
    const video = videoRef.current
    if (!video || !hasSource) return

    video.controls = false
    video.muted = false
    video.autoplay = autoPlay
    video.playsInline = true
    video.preload = "auto"

    if (isLikelyHlsUrl(src) && Hls.isSupported()) {
      const hls = new Hls({
        startLevel: 2,
        capLevelToPlayerSize: true,
      })

      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          stopProgressLoop()
        }
      })
    } else {
      video.src = src
    }

    return () => {
      stopProgressLoop()
      hlsRef.current?.destroy()
      hlsRef.current = null
      video.pause()
      video.removeAttribute("src")
      video.load()
      attemptedAutoplayRef.current = false
    }
  }, [autoPlay, hasSource, src, stopProgressLoop])

  useBrowserLayoutEffect(() => {
    if (!autoPlay || !hasSource || attemptedAutoplayRef.current) return

    attemptedAutoplayRef.current = true
    void requestPlayback()
  }, [autoPlay, hasSource, requestPlayback])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => {
      setPlaybackState("playing")
      startProgressLoop()
    }
    const handlePause = () => {
      if (!video.ended) {
        stopProgressLoop()
      }
    }
    const handleEnded = () => {
      stopProgressLoop()
      setProgress(PROGRESS_CAP)
      setPlaybackState("ended")
      onEnded?.()
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
    }
  }, [onEnded, startProgressLoop, stopProgressLoop])

  useEffect(
    () => () => {
      stopProgressLoop()
    },
    [stopProgressLoop],
  )

  if (!hasSource) {
    return (
      <div
        className={cn(
          "relative flex w-full items-center justify-center overflow-hidden bg-black",
          fullScreen ? "h-full" : "aspect-[9/16] rounded-2xl",
          className,
        )}
      >
      </div>
    )
  }

  return (
    <div
      className={cn(
        "relative w-full overflow-hidden bg-black",
        fullScreen
          ? "h-full"
          : "aspect-[9/16] rounded-2xl border border-gold/30 shadow-2xl shadow-primary/25",
        className,
      )}
      onContextMenu={(event) => event.preventDefault()}
      data-vsl-player="bunny"
    >
      <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,rgba(0,0,0,0.18),transparent_28%,rgba(0,0,0,0.46))]" />

      <video
        ref={videoRef}
        className={cn(
          "h-full w-full object-cover object-center",
          blockUserInteraction && "pointer-events-none",
        )}
        playsInline
        controls={false}
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        aria-label={title}
      />

      {blockUserInteraction ? (
        <div
          className="absolute inset-0 z-20 cursor-default bg-transparent"
          aria-hidden="true"
        />
      ) : null}

      {playbackState === "blocked" ? (
        <div className="absolute inset-0 z-30 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <button
            type="button"
            onClick={requestPlayback}
            className="flex max-w-[calc(100vw-3rem)] flex-wrap items-center justify-center gap-2 rounded-full bg-gold px-5 py-4 text-center text-sm font-semibold uppercase leading-tight tracking-[0.14em] text-background shadow-xl shadow-gold/20 transition-transform active:scale-95"
          >
            <Play className="size-4 fill-current" />
            REPRODUCIR MENSAJE DE JANNY
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "pointer-events-none absolute z-40 h-1.5 overflow-hidden bg-white/15",
          fullScreen
            ? "bottom-[max(20px,env(safe-area-inset-bottom))] left-6 right-6 rounded-full"
            : "bottom-0 left-0 right-0",
        )}
      >
        <div
          className="h-full rounded-r-full bg-gradient-to-r from-primary to-gold transition-[width] duration-300 ease-linear"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
