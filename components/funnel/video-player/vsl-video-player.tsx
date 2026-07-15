"use client"

import Hls from "hls.js"
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react"
import { LoaderCircle, Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { DummyProgressBar } from "./dummy-progress-bar"
import { useDummyVslProgress } from "./use-dummy-vsl-progress"

declare global {
  interface Window {
    __mnleVslProgressDebug?: {
      progress: number
      elapsedSeconds: number
      durationSeconds: number | null
      firstThirdTime: number
      component: string
    }
  }
}

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
  startMuted?: boolean
  showSoundOverlay?: boolean
  videoFit?: "contain" | "cover"
  videoScale?: number
}

const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect
type PlaybackState = "idle" | "playing" | "paused" | "blocked" | "error" | "ended"

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
  startMuted = false,
  showSoundOverlay = false,
  videoFit = "contain",
  videoScale = 1,
}: VslVideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null)
  const hlsRef = useRef<Hls | null>(null)
  const playbackStateRef = useRef<PlaybackState>("idle")
  const attemptedAutoplayRef = useRef(false)
  const completionTimeoutRef = useRef<number | null>(null)
  const startedRef = useRef(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
  const [loadError, setLoadError] = useState(false)
  const [debugProgress, setDebugProgress] = useState(false)
  const [isRequestingPlayback, setIsRequestingPlayback] = useState(false)
  const [isMuted, setIsMuted] = useState(startMuted)
  const {
    progress,
    elapsedSeconds,
    durationSeconds,
    firstThirdTime,
    complete,
    setKnownDuration,
  } = useDummyVslProgress()
  const hasSource = src.trim().length > 0

  const updatePlaybackState = useCallback((state: PlaybackState) => {
    playbackStateRef.current = state
    setPlaybackState(state)
  }, [])

  useEffect(() => {
    setDebugProgress(
      new URLSearchParams(window.location.search).get("debug_progress") === "1",
    )
  }, [])

  const syncDuration = useCallback(() => {
    const duration = videoRef.current?.duration

    if (Number.isFinite(duration) && duration && duration > 0) {
      setKnownDuration(duration)
    }
  }, [setKnownDuration])

  const requestPlayback = useCallback(async (unmute = false) => {
    const video = videoRef.current
    if (!video || !hasSource || loadError || isRequestingPlayback) return

    setIsRequestingPlayback(true)
    try {
      if (unmute) {
        video.currentTime = 0
        video.volume = 1
      }
      video.muted = startMuted && !unmute
      video.controls = false
      await video.play()
      setIsMuted(video.muted)
      updatePlaybackState("playing")
      if (!startedRef.current) {
        startedRef.current = true
        onStarted?.()
      }
    } catch {
      updatePlaybackState("blocked")
      onPlaybackBlocked?.()
    } finally {
      setIsRequestingPlayback(false)
    }
  }, [
    hasSource,
    isRequestingPlayback,
    loadError,
    onPlaybackBlocked,
    onStarted,
    startMuted,
    updatePlaybackState,
  ])

  useBrowserLayoutEffect(() => {
    const video = videoRef.current
    if (!video || !hasSource) return

    hlsRef.current?.destroy()
    hlsRef.current = null
    attemptedAutoplayRef.current = false
    startedRef.current = false
    setLoadError(false)
    updatePlaybackState("idle")

    video.controls = false
    video.muted = startMuted
    setIsMuted(startMuted)
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

    return () => {
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
    startMuted,
    updatePlaybackState,
  ])

  useBrowserLayoutEffect(() => {
    if (!autoPlay || !hasSource || attemptedAutoplayRef.current) return

    attemptedAutoplayRef.current = true
    void requestPlayback(false)
  }, [autoPlay, hasSource, requestPlayback])

  const unmutePlayback = useCallback(async () => {
    await requestPlayback(true)
  }, [requestPlayback])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handlePlay = () => {
      syncDuration()
      updatePlaybackState("playing")
      if (!startedRef.current) {
        startedRef.current = true
        onStarted?.()
      }
    }
    const handlePause = () => {
      if (!video.ended) {
        updatePlaybackState("paused")
      }
    }
    const handleEnded = () => {
      if (completionTimeoutRef.current !== null) return

      complete()
      updatePlaybackState("ended")
      completionTimeoutRef.current = window.setTimeout(() => {
        completionTimeoutRef.current = null
        onEnded?.()
      }, 350)
    }
    const handleError = () => {
      setLoadError(true)
      updatePlaybackState("error")
    }

    video.addEventListener("play", handlePlay)
    video.addEventListener("pause", handlePause)
    video.addEventListener("ended", handleEnded)
    video.addEventListener("error", handleError)
    video.addEventListener("loadedmetadata", syncDuration)
    video.addEventListener("durationchange", syncDuration)

    return () => {
      if (completionTimeoutRef.current !== null) {
        window.clearTimeout(completionTimeoutRef.current)
        completionTimeoutRef.current = null
      }
      video.removeEventListener("play", handlePlay)
      video.removeEventListener("pause", handlePause)
      video.removeEventListener("ended", handleEnded)
      video.removeEventListener("error", handleError)
      video.removeEventListener("loadedmetadata", syncDuration)
      video.removeEventListener("durationchange", syncDuration)
    }
  }, [
    syncDuration,
    onEnded,
    onStarted,
    complete,
    updatePlaybackState,
  ])

  useEffect(() => {
    if (!debugProgress || typeof window === "undefined") return

    window.__mnleVslProgressDebug = {
      progress,
      elapsedSeconds,
      durationSeconds,
      firstThirdTime,
      component: "VslVideoPlayer",
    }

    return () => {
      if (window.__mnleVslProgressDebug?.component === "VslVideoPlayer") {
        delete window.__mnleVslProgressDebug
      }
    }
  }, [debugProgress, durationSeconds, elapsedSeconds, firstThirdTime, progress])

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
        "relative isolate w-full max-w-full overflow-hidden bg-[#050008]",
        fullScreen
          ? "h-full"
          : "aspect-[9/16] rounded-2xl border border-gold/30 shadow-2xl shadow-primary/25",
        className,
      )}
      onContextMenu={(event) => event.preventDefault()}
      data-vsl-player="bunny"
    >
      <div
        className="pointer-events-none absolute inset-0 z-0 overflow-hidden bg-[#050008]"
        aria-hidden="true"
      >
        <div className="absolute inset-[-14%] bg-[radial-gradient(circle_at_50%_22%,rgba(202,142,255,0.26),transparent_44%),radial-gradient(circle_at_50%_78%,rgba(242,195,107,0.16),transparent_52%),linear-gradient(180deg,rgba(30,4,43,0.86),rgba(5,0,8,0.96))] blur-2xl" />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(5,0,8,0.72),transparent_24%,transparent_76%,rgba(5,0,8,0.72))]" />
      </div>

      <div className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(180deg,rgba(0,0,0,0.14),transparent_30%,rgba(0,0,0,0.38))]" />

      <video
        ref={videoRef}
        className={cn(
          "absolute inset-0 z-10 h-full w-full object-center",
          blockUserInteraction && "pointer-events-none",
        )}
        style={{
          objectFit: videoFit,
          transform: `scale(${Math.min(1.25, Math.max(1, videoScale))})`,
          transformOrigin: "center center",
        }}
        playsInline
        controls={false}
        controlsList="nodownload noplaybackrate noremoteplayback"
        disablePictureInPicture
        aria-label={title}
        onLoadedMetadata={syncDuration}
        onDurationChange={syncDuration}
      />

      {blockUserInteraction ? (
        <div
          className="absolute inset-0 z-30 cursor-default bg-transparent"
          aria-hidden="true"
        />
      ) : null}

      {showSoundOverlay && isMuted ? (
        <button
          type="button"
          aria-label="Haz click para escuchar"
          onClick={() => void unmutePlayback()}
          className="absolute inset-0 z-40 flex cursor-pointer items-center justify-center bg-black/25 px-5 backdrop-blur-[1px]"
        >
          <span className="rounded-full border border-gold/45 bg-[#09030d]/88 px-5 py-3 text-center shadow-2xl shadow-black/50 backdrop-blur-md">
            <strong className="block text-xs font-extrabold tracking-[0.14em] text-white sm:text-sm">
              HAZ CLICK PARA ESCUCHAR
            </strong>
            <small className="mt-0.5 block text-[10px] text-gold/85">
              Toca el video
            </small>
          </span>
        </button>
      ) : null}

      {playbackState === "blocked" ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/70 px-6 backdrop-blur-sm">
          <button
            type="button"
            disabled={isRequestingPlayback}
            aria-busy={isRequestingPlayback}
            onClick={() => void requestPlayback(true)}
            className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-gold px-5 py-4 text-center text-sm font-semibold uppercase leading-tight tracking-[0.14em] text-background shadow-xl shadow-gold/20 transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-90"
          >
            {isRequestingPlayback ? (
              <>
                <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                <span>Veyra está abriendo tu lectura...</span>
              </>
            ) : (
              <>
                <Play className="size-4 fill-current" />
                <span>REPRODUCIR MENSAJE DE JANNY</span>
              </>
            )}
          </button>
        </div>
      ) : null}

      {loadError ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/78 px-6 text-center text-sm font-medium leading-relaxed text-white backdrop-blur-sm">
          No pudimos cargar el mensaje. Revisa tu conexión y vuelve a intentarlo.
        </div>
      ) : null}

      <DummyProgressBar progress={progress} debugLabel="VslVideoPlayer" />
    </div>
  )
}
