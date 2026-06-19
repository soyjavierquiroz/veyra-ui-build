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

const PROGRESS_CAP = 98
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect
type PlaybackState = "idle" | "playing" | "paused" | "blocked" | "error" | "ended"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getPandaLikeProgress(elapsedSeconds: number, isEnded: boolean) {
  if (isEnded) return 100

  const seconds = Math.max(elapsedSeconds, 0)

  if (seconds <= 4) {
    return clamp((seconds / 4) * 50, 0, PROGRESS_CAP)
  }

  if (seconds <= 18) {
    return clamp(50 + ((seconds - 4) / 14) * 20, 0, PROGRESS_CAP)
  }

  if (seconds <= 50) {
    return clamp(70 + ((seconds - 18) / 32) * 15, 0, PROGRESS_CAP)
  }

  if (seconds <= 110) {
    return clamp(85 + ((seconds - 50) / 60) * 9, 0, PROGRESS_CAP)
  }

  const slowTail = 94 + Math.min(4, Math.log1p((seconds - 110) / 20) * 1.2)
  return clamp(slowTail, 0, PROGRESS_CAP)
}

function isLikelyHlsUrl(src: string) {
  return src.toLowerCase().includes(".m3u8")
}

function canPlayHlsNatively(video: HTMLVideoElement) {
  return Boolean(
    video.canPlayType("application/vnd.apple.mpegurl") ||
      video.canPlayType("application/x-mpegURL"),
  )
}

export function VslVideoPlayer({
  src,
  title = "Mensaje privado de Janny",
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
  const currentProgressRef = useRef(1)
  const endedRef = useRef(false)
  const playbackStateRef = useRef<PlaybackState>("idle")
  const attemptedAutoplayRef = useRef(false)
  const startedRef = useRef(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
  const [loadError, setLoadError] = useState(false)
  const [progress, setProgress] = useState(1)
  const hasSource = src.trim().length > 0

  const updatePlaybackState = useCallback((state: PlaybackState) => {
    playbackStateRef.current = state
    setPlaybackState(state)
  }, [])

  const stopProgressLoop = useCallback(() => {
    if (progressRafRef.current !== null) {
      cancelAnimationFrame(progressRafRef.current)
      progressRafRef.current = null
    }
  }, [])

  const startProgressLoop = useCallback(() => {
    if (progressRafRef.current !== null) return

    if (progressStartedAtRef.current === null) {
      progressStartedAtRef.current = performance.now()
    }

    const tick = (now: number) => {
      const startedAt = progressStartedAtRef.current ?? now
      const elapsedSeconds = (now - startedAt) / 1000

      setProgress((current) => {
        const nextProgress = getPandaLikeProgress(
          elapsedSeconds,
          endedRef.current,
        )
        const stableProgress = Math.max(current, nextProgress)
        currentProgressRef.current = stableProgress
        return stableProgress
      })

      if (!endedRef.current) {
        progressRafRef.current = requestAnimationFrame(tick)
      } else {
        progressRafRef.current = null
      }
    }

    progressRafRef.current = requestAnimationFrame(tick)
  }, [])

  const requestPlayback = useCallback(async () => {
    const video = videoRef.current
    if (!video || !hasSource || loadError) return

    try {
      startProgressLoop()
      video.muted = false
      video.controls = false
      await video.play()
      updatePlaybackState("playing")
      if (!startedRef.current) {
        startedRef.current = true
        onStarted?.()
      }
    } catch {
      updatePlaybackState("blocked")
      onPlaybackBlocked?.()
    }
  }, [
    hasSource,
    loadError,
    onPlaybackBlocked,
    onStarted,
    startProgressLoop,
    updatePlaybackState,
  ])

  useBrowserLayoutEffect(() => {
    const video = videoRef.current
    if (!video || !hasSource) return

    stopProgressLoop()
    hlsRef.current?.destroy()
    hlsRef.current = null
    progressStartedAtRef.current = performance.now()
    currentProgressRef.current = 1
    endedRef.current = false
    attemptedAutoplayRef.current = false
    startedRef.current = false
    setProgress(1)
    setLoadError(false)
    updatePlaybackState("idle")

    video.controls = false
    video.muted = false
    video.autoplay = autoPlay
    video.playsInline = true
    video.preload = "auto"

    if (isLikelyHlsUrl(src) && canPlayHlsNatively(video)) {
      video.src = src
    } else if (isLikelyHlsUrl(src) && Hls.isSupported()) {
      const hls = new Hls({
        startLevel: 2,
        capLevelToPlayerSize: true,
      })

      hlsRef.current = hls
      hls.loadSource(src)
      hls.attachMedia(video)
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (data.fatal) {
          setLoadError(true)
          updatePlaybackState("error")
        }
      })
    } else if (isLikelyHlsUrl(src)) {
      setLoadError(true)
      updatePlaybackState("error")
    } else {
      video.src = src
    }

    startProgressLoop()

    return () => {
      stopProgressLoop()
      hlsRef.current?.destroy()
      hlsRef.current = null
      video.pause()
      video.removeAttribute("src")
      video.load()
      attemptedAutoplayRef.current = false
    }
  }, [
    autoPlay,
    hasSource,
    src,
    startProgressLoop,
    stopProgressLoop,
    updatePlaybackState,
  ])

  useBrowserLayoutEffect(() => {
    if (!autoPlay || !hasSource || attemptedAutoplayRef.current) return

    attemptedAutoplayRef.current = true
    void requestPlayback()
  }, [autoPlay, hasSource, requestPlayback])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => {
      updatePlaybackState("playing")
      startProgressLoop()
      if (!startedRef.current) {
        startedRef.current = true
        onStarted?.()
      }
    }
    const handlePause = () => {
      if (!video.ended) {
        updatePlaybackState("paused")
        startProgressLoop()
      }
    }
    const handleEnded = () => {
      endedRef.current = true
      stopProgressLoop()
      currentProgressRef.current = 100
      setProgress(100)
      updatePlaybackState("ended")
      onEnded?.()
    }
    const handleError = () => {
      setLoadError(true)
      updatePlaybackState("error")
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("error", handleError)

    return () => {
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("error", handleError)
    }
  }, [
    onEnded,
    onStarted,
    startProgressLoop,
    stopProgressLoop,
    updatePlaybackState,
  ])

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

      {loadError ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/78 px-6 text-center text-sm font-medium leading-relaxed text-white backdrop-blur-sm">
          No pudimos cargar el mensaje. Revisa tu conexión y vuelve a intentarlo.
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
