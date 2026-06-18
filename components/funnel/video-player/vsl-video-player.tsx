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
  onStarted?: () => void
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

function getDummyProgress(elapsedMs: number) {
  const seconds = Math.max(elapsedMs, 0) / 1000

  if (seconds <= 8) {
    return clamp((seconds / 8) * 50, 0, PROGRESS_CAP)
  }

  if (seconds <= 28) {
    return clamp(50 + ((seconds - 8) / 20) * 25, 0, PROGRESS_CAP)
  }

  if (seconds <= 75) {
    return clamp(75 + ((seconds - 28) / 47) * 17, 0, PROGRESS_CAP)
  }

  if (seconds <= 140) {
    return clamp(92 + ((seconds - 75) / 65) * 6, 0, PROGRESS_CAP)
  }

  return PROGRESS_CAP
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
  onStarted,
  onEnded,
  onPlaybackBlocked,
}: VslVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const progressRafRef = useRef<number | null>(null)
  const progressStartedAtRef = useRef<number | null>(null)
  const accumulatedProgressMsRef = useRef(0)
  const attemptedAutoplayRef = useRef(false)
  const startedRef = useRef(false)
  const [playbackState, setPlaybackState] = useState<
    "idle" | "playing" | "blocked" | "ended"
  >("idle")
  const [progress, setProgress] = useState(1)
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
      const elapsedMs = accumulatedProgressMsRef.current + liveMs

      setProgress(getDummyProgress(elapsedMs))
      progressRafRef.current = requestAnimationFrame(tick)
    }

    progressRafRef.current = requestAnimationFrame(tick)
  }, [simulatedDurationSeconds, stopProgressLoop])

  const requestPlayback = useCallback(async () => {
    const video = videoRef.current
    if (!video || !hasSource) return

    try {
      startProgressLoop()
      video.muted = false
      video.controls = false
      await video.play()
      setPlaybackState("playing")
    } catch {
      setPlaybackState("blocked")
      onPlaybackBlocked?.()
    }
  }, [hasSource, onPlaybackBlocked, startProgressLoop])

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
      if (!startedRef.current) {
        startedRef.current = true
        onStarted?.()
      }
    }
    const handlePause = () => {
      if (!video.ended) {
        stopProgressLoop()
      }
    }
    const handleEnded = () => {
      stopProgressLoop()
      setProgress(100)
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
  }, [onEnded, onStarted, startProgressLoop, stopProgressLoop])

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
        "relative w-full max-w-full overflow-hidden bg-black",
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
            className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-gold px-5 py-4 text-center text-sm font-semibold uppercase leading-tight tracking-[0.14em] text-background shadow-xl shadow-gold/20 transition-transform active:scale-95"
          >
            <Play className="size-4 fill-current" />
            REPRODUCIR MENSAJE DE JANNY
          </button>
        </div>
      ) : null}

      <div
        className={cn(
          "funnel-progress pointer-events-none",
          fullScreen
            ? ""
            : "bottom-0 left-0 right-0",
        )}
      >
        <div
          className="funnel-progress__bar transition-[width] duration-300 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  )
}
