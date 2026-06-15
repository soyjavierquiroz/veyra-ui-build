"use client"

import {
  type SyntheticEvent,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { extractYouTubeVideoId } from "./youtube-utils"

export type YouTubeShortsVslPlayerProps = {
  videoUrl: string
  autoPlay?: boolean
  startWithSound?: boolean
  simulatedDurationSeconds?: number
  blockUserInteraction?: boolean
  cleanMode?: boolean
  fitMode?: "cover" | "contain"
  verticalMode?: boolean
  iframeScale?: number
  iframeOffsetX?: number
  iframeOffsetY?: number
  maskTop?: number
  maskBottom?: number
  maskLeft?: number
  maskRight?: number
  fallbackLabel?: string
  showSimulatedProgress?: boolean
  className?: string
  onEnded?: () => void
  onPlaybackBlocked?: () => void
}

type PlaybackState = "idle" | "playing" | "blocked" | "error" | "ended"

type YouTubePlayer = {
  cueVideoById?: (videoId: string) => void
  destroy?: () => void
  getIframe?: () => HTMLIFrameElement
  mute?: () => void
  playVideo?: () => void
  stopVideo?: () => void
  unMute?: () => void
  setVolume?: (volume: number) => void
}

type YouTubeEvent = {
  data: number
  target: YouTubePlayer
}

declare global {
  interface Window {
    YT?: any
    onYouTubeIframeAPIReady?: () => void
  }
}

const DEFAULT_SIMULATED_DURATION = 900
const PROGRESS_CAP = 98
const PLAYBACK_CHECK_DELAY_MS = 1500
const useBrowserLayoutEffect =
  typeof window === "undefined" ? useEffect : useLayoutEffect

let youtubeApiPromise: Promise<any> | null = null
let prewarmPlayer: YouTubePlayer | null = null
let prewarmHost: HTMLDivElement | null = null
let prewarmedVideoId: string | null = null

export function preloadYouTubeIframeApi(): Promise<any> {
  if (typeof window === "undefined") {
    return Promise.reject(new Error("YouTube IFrame API requires window"))
  }

  if (window.YT?.Player) {
    return Promise.resolve(window.YT)
  }

  if (youtubeApiPromise) {
    return youtubeApiPromise
  }

  youtubeApiPromise = new Promise((resolve, reject) => {
    const previousReady = window.onYouTubeIframeAPIReady

    window.onYouTubeIframeAPIReady = () => {
      previousReady?.()
      resolve(window.YT)
    }

    const existingScript = document.querySelector<HTMLScriptElement>(
      'script[src="https://www.youtube.com/iframe_api"]',
    )

    if (existingScript) {
      existingScript.addEventListener("error", () => {
        reject(new Error("YouTube IFrame API failed to load"))
      })
      return
    }

    const script = document.createElement("script")
    script.src = "https://www.youtube.com/iframe_api"
    script.async = true
    script.onerror = () => {
      reject(new Error("YouTube IFrame API failed to load"))
    }
    document.head.appendChild(script)
  })

  return youtubeApiPromise
}

function ensureYouTubePreconnects() {
  if (typeof document === "undefined") return

  const urls = [
    "https://www.youtube.com",
    "https://www.youtube-nocookie.com",
    "https://i.ytimg.com",
    "https://s.ytimg.com",
    "https://www.google.com",
    "https://googleads.g.doubleclick.net",
  ]

  for (const url of urls) {
    for (const rel of ["preconnect", "dns-prefetch"] as const) {
      const selector = `link[rel="${rel}"][href="${url}"]`
      if (document.head.querySelector(selector)) continue

      const link = document.createElement("link")
      link.rel = rel
      link.href = url
      if (rel === "preconnect") {
        link.crossOrigin = "anonymous"
      }
      document.head.appendChild(link)
    }
  }
}

function ensurePrewarmHost() {
  if (typeof document === "undefined") return null
  if (prewarmHost?.isConnected) return prewarmHost

  const host = document.createElement("div")
  host.setAttribute("aria-hidden", "true")
  host.style.position = "absolute"
  host.style.left = "-9999px"
  host.style.top = "-9999px"
  host.style.width = "1px"
  host.style.height = "1px"
  host.style.opacity = "0"
  host.style.pointerEvents = "none"
  host.style.overflow = "hidden"
  document.body.appendChild(host)
  prewarmHost = host
  return host
}

export function prewarmYouTubeShort(videoUrl: string): void {
  if (typeof window === "undefined") return

  const videoId = extractYouTubeVideoId(videoUrl)
  if (!videoId || prewarmedVideoId === videoId) return

  ensureYouTubePreconnects()

  void preloadYouTubeIframeApi()
    .then((YT) => {
      const host = ensurePrewarmHost()
      if (!host) return

      if (prewarmPlayer) {
        try {
          prewarmPlayer.mute?.()
          prewarmPlayer.cueVideoById?.(videoId)
          prewarmedVideoId = videoId
          return
        } catch {
          try {
            prewarmPlayer.destroy?.()
          } catch {
            // Best-effort cleanup for the hidden prewarm player.
          }
          prewarmPlayer = null
          host.replaceChildren()
        }
      }

      prewarmPlayer = new YT.Player(host, {
        videoId,
        width: "1",
        height: "1",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          enablejsapi: 1,
          fs: 0,
          iv_load_policy: 3,
          modestbranding: 1,
          origin: window.location.origin,
          playsinline: 1,
          rel: 0,
        },
        events: {
          onReady: (event: { target: YouTubePlayer }) => {
            try {
              event.target.mute?.()
              event.target.cueVideoById?.(videoId)
              prewarmedVideoId = videoId
            } catch {
              // Prewarm is opportunistic and must never block the funnel.
            }
          },
        },
      })
    })
    .catch(() => {
      // Prewarm is opportunistic and must never block the funnel.
    })
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getPsychologicalProgress(elapsedSeconds: number, durationSeconds: number) {
  const safeElapsed = Number.isFinite(elapsedSeconds)
    ? Math.max(elapsedSeconds, 0)
    : 0
  const safeDuration =
    durationSeconds > 0 ? durationSeconds : DEFAULT_SIMULATED_DURATION
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

function stopEvent(event: SyntheticEvent<HTMLElement>) {
  event.preventDefault()
  event.stopPropagation()
}

export function YouTubeShortsVslPlayer({
  videoUrl,
  autoPlay = true,
  startWithSound = true,
  simulatedDurationSeconds = DEFAULT_SIMULATED_DURATION,
  blockUserInteraction = true,
  cleanMode = true,
  fitMode = "cover",
  verticalMode = false,
  iframeScale = 1.12,
  iframeOffsetX = 0,
  iframeOffsetY = 0,
  maskTop = 0,
  maskBottom = 82,
  maskLeft = 0,
  maskRight = 0,
  fallbackLabel = "REPRODUCIR MENSAJE DE JANNY",
  showSimulatedProgress = true,
  className,
  onEnded,
  onPlaybackBlocked,
}: YouTubeShortsVslPlayerProps) {
  const playerHostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const progressRafRef = useRef<number | null>(null)
  const progressStartedAtRef = useRef<number | null>(null)
  const accumulatedProgressMsRef = useRef(0)
  const playbackCheckTimeoutRef = useRef<number | null>(null)
  const pausedRecoveryTimeoutRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)
  const internalStopRef = useRef(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
  const [progress, setProgress] = useState(0)
  const videoId = useMemo(() => extractYouTubeVideoId(videoUrl), [videoUrl])

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

  const clearPlaybackCheck = useCallback(() => {
    if (playbackCheckTimeoutRef.current !== null) {
      window.clearTimeout(playbackCheckTimeoutRef.current)
      playbackCheckTimeoutRef.current = null
    }
  }, [])

  const clearPausedRecovery = useCallback(() => {
    if (pausedRecoveryTimeoutRef.current !== null) {
      window.clearTimeout(pausedRecoveryTimeoutRef.current)
      pausedRecoveryTimeoutRef.current = null
    }
  }, [])

  const applyIframeStyles = useCallback((player: YouTubePlayer) => {
    const iframe = player.getIframe?.()
    if (!iframe) return

    iframe.style.position = "absolute"
    iframe.style.inset = "0"
    iframe.style.width = "100%"
    iframe.style.height = "100%"
    iframe.style.minWidth = "100%"
    iframe.style.minHeight = "100%"
    iframe.style.border = "0"
  }, [])

  const requestPlayback = useCallback(() => {
    const player = playerRef.current
    if (!player) return

    try {
      if (startWithSound) {
        player.unMute?.()
        player.setVolume?.(100)
      }
      player.playVideo?.()
    } catch {
      setPlaybackState("blocked")
      onPlaybackBlocked?.()
      stopProgressLoop()
    }
  }, [onPlaybackBlocked, startWithSound, stopProgressLoop])

  const schedulePlaybackCheck = useCallback(() => {
    clearPlaybackCheck()
    playbackCheckTimeoutRef.current = window.setTimeout(() => {
      if (isPlayingRef.current) return

      setPlaybackState("blocked")
      onPlaybackBlocked?.()
      stopProgressLoop()
    }, PLAYBACK_CHECK_DELAY_MS)
  }, [clearPlaybackCheck, onPlaybackBlocked, stopProgressLoop])

  const handleFallbackClick = useCallback(() => {
    setPlaybackState("idle")
    requestPlayback()
    schedulePlaybackCheck()
  }, [requestPlayback, schedulePlaybackCheck])

  useBrowserLayoutEffect(() => {
    if (!videoId || !playerHostRef.current) return

    let cancelled = false
    setPlaybackState("idle")
    setProgress(0)
    isPlayingRef.current = false
    accumulatedProgressMsRef.current = 0

    void preloadYouTubeIframeApi()
      .then((YT) => {
        if (cancelled || !playerHostRef.current) return

        playerRef.current = new YT.Player(playerHostRef.current, {
          videoId,
          width: "100%",
          height: "100%",
          playerVars: {
            autoplay: autoPlay ? 1 : 0,
            cc_load_policy: 0,
            controls: 0,
            disablekb: 1,
            enablejsapi: 1,
            fs: 0,
            iv_load_policy: 3,
            modestbranding: 1,
            origin: window.location.origin,
            playsinline: 1,
            rel: 0,
            showinfo: 0,
          },
          events: {
            onReady: (event: { target: YouTubePlayer }) => {
              if (cancelled) return

              applyIframeStyles(event.target)
              if (autoPlay) {
                requestPlayback()
                schedulePlaybackCheck()
              }
            },
            onStateChange: (event: YouTubeEvent) => {
              const state = event.data
              applyIframeStyles(event.target)

              if (state === YT.PlayerState.PLAYING) {
                isPlayingRef.current = true
                clearPlaybackCheck()
                setPlaybackState("playing")
                startProgressLoop()
                return
              }

              if (state === YT.PlayerState.ENDED) {
                internalStopRef.current = true
                isPlayingRef.current = false
                clearPlaybackCheck()
                stopProgressLoop()
                setProgress(PROGRESS_CAP)
                setPlaybackState("ended")
                onEnded?.()
                return
              }

              if (state === YT.PlayerState.PAUSED) {
                isPlayingRef.current = false
                stopProgressLoop()

                if (blockUserInteraction && !internalStopRef.current) {
                  clearPausedRecovery()
                  pausedRecoveryTimeoutRef.current = window.setTimeout(() => {
                    requestPlayback()
                  }, 250)
                }
              }
            },
            onError: () => {
              isPlayingRef.current = false
              clearPlaybackCheck()
              stopProgressLoop()
              setPlaybackState("error")
            },
          },
        })
      })
      .catch(() => {
        if (cancelled) return
        setPlaybackState("error")
      })

    return () => {
      cancelled = true
      clearPlaybackCheck()
      clearPausedRecovery()
      stopProgressLoop()
      internalStopRef.current = true
      try {
        playerRef.current?.stopVideo?.()
        playerRef.current?.destroy?.()
      } catch {
        // Best-effort cleanup for the cross-origin iframe player.
      }
      playerRef.current = null
    }
  }, [
    applyIframeStyles,
    autoPlay,
    blockUserInteraction,
    clearPausedRecovery,
    clearPlaybackCheck,
    onEnded,
    requestPlayback,
    schedulePlaybackCheck,
    startProgressLoop,
    stopProgressLoop,
    videoId,
  ])

  useEffect(
    () => () => {
      clearPlaybackCheck()
      clearPausedRecovery()
      stopProgressLoop()
    },
    [clearPausedRecovery, clearPlaybackCheck, stopProgressLoop],
  )

  if (!videoId) {
    return (
      <div
        className={cn(
          "relative flex h-full w-full items-center justify-center overflow-hidden bg-black px-8 text-center text-sm font-medium uppercase tracking-[0.16em] text-white/70",
          className,
        )}
      >
        Short de YouTube pendiente de configuración.
      </div>
    )
  }

  return (
    <div
      className={cn("relative h-full w-full overflow-hidden bg-black", className)}
      onContextMenu={(event) => event.preventDefault()}
      data-vsl-player="youtube-shorts"
      data-clean-mode={cleanMode ? "true" : "false"}
      data-fit-mode={fitMode}
      data-vertical-mode={verticalMode ? "true" : "false"}
    >
      <div
        className={cn(
          "absolute left-1/2 top-1/2 h-full -translate-x-1/2 -translate-y-1/2",
          verticalMode ? "aspect-[9/16] w-auto min-w-full" : "w-full",
          fitMode === "contain" ? "max-h-full max-w-full" : "",
        )}
        style={{
          transform: `translate(calc(-50% + ${iframeOffsetX}px), calc(-50% + ${iframeOffsetY}px)) scale(${
            cleanMode ? iframeScale : 1
          })`,
          transformOrigin: "center center",
        }}
      >
        <div ref={playerHostRef} className="absolute inset-0 h-full w-full" />
      </div>

      {cleanMode ? (
        <>
          <div
            className="pointer-events-none absolute left-0 right-0 top-0 z-20 bg-black"
            style={{ height: `${Math.max(maskTop, 0)}px` }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 bg-black"
            style={{ height: `${Math.max(maskBottom, 0)}px` }}
          />
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 bg-black"
            style={{ width: `${Math.max(maskLeft, 0)}px` }}
          />
          <div
            className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 bg-black"
            style={{ width: `${Math.max(maskRight, 0)}px` }}
          />
        </>
      ) : null}

      <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-black/55 to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-black/75 to-transparent" />

      {blockUserInteraction ? (
        <div
          className="absolute inset-0 z-30 cursor-default bg-transparent [touch-action:none]"
          aria-hidden="true"
          onClick={stopEvent}
          onDoubleClick={stopEvent}
          onPointerDown={stopEvent}
        />
      ) : null}

      {playbackState === "blocked" || playbackState === "error" ? (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/62 px-6 backdrop-blur-[2px]">
          <button
            type="button"
            onClick={handleFallbackClick}
            className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-gold px-5 py-4 text-center text-sm font-semibold uppercase leading-tight tracking-[0.14em] text-background shadow-xl shadow-gold/20 transition-transform active:scale-95"
          >
            <Play className="size-4 fill-current" />
            {fallbackLabel}
          </button>
        </div>
      ) : null}

      {showSimulatedProgress ? (
        <div className="pointer-events-none absolute bottom-[max(22px,env(safe-area-inset-bottom))] left-6 right-6 z-40 h-1.5 overflow-hidden rounded-full bg-white/15">
          <div
            className="h-full rounded-r-full bg-gradient-to-r from-primary to-gold shadow-[0_0_18px_rgba(235,199,120,0.45)] transition-[width] duration-300 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
      ) : null}
    </div>
  )
}
