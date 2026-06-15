"use client"

import {
  forwardRef,
  type SyntheticEvent,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { Play } from "lucide-react"
import { cn } from "@/lib/utils"
import { extractYouTubeVideoId } from "./youtube-utils"
import {
  ensureYouTubePreconnects,
  preloadYouTubeIframeApi,
} from "./youtube-shorts-vsl-player"

export type PreparedYouTubeResultPlayerHandle = {
  prepare: (videoUrl: string) => void
  playWithSound: () => void
  stop: () => void
  reset: () => void
}

export type PreparedYouTubeResultPlayerProps = {
  videoUrl: string | null
  active: boolean
  visible: boolean
  fallbackLabel?: string
  iframeScale?: number
  iframeOffsetX?: number
  iframeOffsetY?: number
  maskTop?: number
  maskBottom?: number
  maskLeft?: number
  maskRight?: number
  logoMaskEnabled?: boolean
  logoMaskX?: number
  logoMaskY?: number
  logoMaskWidth?: number
  logoMaskHeight?: number
  logoMaskRadius?: number
  autoPlayWhenVisible?: boolean
  onEnded?: () => void
  onPlaybackBlocked?: () => void
}

type PlaybackState = "idle" | "preparing" | "ready" | "playing" | "blocked" | "error" | "ended"

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

const PLAYBACK_CHECK_DELAY_MS = 1600
const PREPARING_LABEL_DELAY_MS = 600

function stopEvent(event: SyntheticEvent<HTMLElement>) {
  event.preventDefault()
  event.stopPropagation()
}

export const PreparedYouTubeResultPlayer = forwardRef<
  PreparedYouTubeResultPlayerHandle,
  PreparedYouTubeResultPlayerProps
>(function PreparedYouTubeResultPlayer(
  {
    videoUrl,
    active,
    visible,
    fallbackLabel = "REPRODUCIR MENSAJE DE VEYRA",
    iframeScale = 1.04,
    iframeOffsetX = 0,
    iframeOffsetY = 0,
    maskTop = 0,
    maskBottom = 48,
    maskLeft = 0,
    maskRight = 0,
    logoMaskEnabled = true,
    logoMaskX = 50,
    logoMaskY = 50,
    logoMaskWidth = 180,
    logoMaskHeight = 78,
    logoMaskRadius = 18,
    autoPlayWhenVisible = true,
    onEnded,
    onPlaybackBlocked,
  },
  ref,
) {
  const playerHostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const preparedVideoIdRef = useRef<string | null>(null)
  const pendingVideoIdRef = useRef<string | null>(null)
  const pendingPlayRef = useRef(false)
  const playbackCheckTimeoutRef = useRef<number | null>(null)
  const preparingTimeoutRef = useRef<number | null>(null)
  const pausedRecoveryTimeoutRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)
  const internalStopRef = useRef(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
  const [showPreparing, setShowPreparing] = useState(false)
  const videoId = useMemo(
    () => (videoUrl ? extractYouTubeVideoId(videoUrl) : null),
    [videoUrl],
  )

  const clearPlaybackCheck = useCallback(() => {
    if (playbackCheckTimeoutRef.current === null) return
    window.clearTimeout(playbackCheckTimeoutRef.current)
    playbackCheckTimeoutRef.current = null
  }, [])

  const clearPreparingTimer = useCallback(() => {
    if (preparingTimeoutRef.current === null) return
    window.clearTimeout(preparingTimeoutRef.current)
    preparingTimeoutRef.current = null
  }, [])

  const clearPausedRecovery = useCallback(() => {
    if (pausedRecoveryTimeoutRef.current === null) return
    window.clearTimeout(pausedRecoveryTimeoutRef.current)
    pausedRecoveryTimeoutRef.current = null
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

  const schedulePlaybackCheck = useCallback(() => {
    clearPlaybackCheck()
    playbackCheckTimeoutRef.current = window.setTimeout(() => {
      if (isPlayingRef.current) return

      setPlaybackState("blocked")
      setShowPreparing(false)
      onPlaybackBlocked?.()
    }, PLAYBACK_CHECK_DELAY_MS)
  }, [clearPlaybackCheck, onPlaybackBlocked])

  const schedulePreparingLabel = useCallback(() => {
    clearPreparingTimer()
    setShowPreparing(false)
    preparingTimeoutRef.current = window.setTimeout(() => {
      if (isPlayingRef.current) return
      setShowPreparing(true)
    }, PREPARING_LABEL_DELAY_MS)
  }, [clearPreparingTimer])

  const cuePreparedVideo = useCallback(
    (targetVideoId: string) => {
      const player = playerRef.current
      if (!player) return false

      try {
        player.mute?.()
        player.cueVideoById?.(targetVideoId)
        preparedVideoIdRef.current = targetVideoId
        pendingVideoIdRef.current = null
        internalStopRef.current = false
        setPlaybackState("ready")
        return true
      } catch {
        setPlaybackState("error")
        return false
      }
    },
    [],
  )

  const playWithSound = useCallback(() => {
    pendingPlayRef.current = true
    setPlaybackState("preparing")
    schedulePreparingLabel()

    const player = playerRef.current
    if (!player) return

    try {
      internalStopRef.current = false
      player.unMute?.()
      player.setVolume?.(100)
      player.playVideo?.()
      schedulePlaybackCheck()
    } catch {
      pendingPlayRef.current = false
      clearPreparingTimer()
      setShowPreparing(false)
      setPlaybackState("blocked")
      onPlaybackBlocked?.()
    }
  }, [
    clearPreparingTimer,
    onPlaybackBlocked,
    schedulePlaybackCheck,
    schedulePreparingLabel,
  ])

  const prepare = useCallback(
    (nextVideoUrl: string) => {
      const nextVideoId = extractYouTubeVideoId(nextVideoUrl)
      if (!nextVideoId || !playerHostRef.current) return

      ensureYouTubePreconnects()

      if (preparedVideoIdRef.current === nextVideoId && playerRef.current) {
        return
      }

      pendingVideoIdRef.current = nextVideoId
      setPlaybackState("preparing")

      void preloadYouTubeIframeApi()
        .then((YT) => {
          if (!playerHostRef.current) return

          if (playerRef.current) {
            cuePreparedVideo(nextVideoId)
            return
          }

          playerRef.current = new YT.Player(playerHostRef.current, {
            videoId: nextVideoId,
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 0,
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
                applyIframeStyles(event.target)
                playerRef.current = event.target
                cuePreparedVideo(nextVideoId)

                if (pendingPlayRef.current) {
                  playWithSound()
                }
              },
              onStateChange: (event: YouTubeEvent) => {
                const state = event.data
                applyIframeStyles(event.target)

                if (state === YT.PlayerState.PLAYING) {
                  pendingPlayRef.current = false
                  isPlayingRef.current = true
                  clearPlaybackCheck()
                  clearPreparingTimer()
                  clearPausedRecovery()
                  setShowPreparing(false)
                  setPlaybackState("playing")
                  return
                }

                if (state === YT.PlayerState.ENDED) {
                  pendingPlayRef.current = false
                  isPlayingRef.current = false
                  internalStopRef.current = true
                  clearPlaybackCheck()
                  clearPreparingTimer()
                  clearPausedRecovery()
                  setShowPreparing(false)
                  setPlaybackState("ended")
                  onEnded?.()
                  return
                }

                if (state === YT.PlayerState.PAUSED) {
                  isPlayingRef.current = false
                  if (visible && !internalStopRef.current) {
                    clearPausedRecovery()
                    pausedRecoveryTimeoutRef.current = window.setTimeout(() => {
                      playWithSound()
                    }, 250)
                  }
                }
              },
              onError: () => {
                pendingPlayRef.current = false
                isPlayingRef.current = false
                clearPlaybackCheck()
                clearPreparingTimer()
                clearPausedRecovery()
                setShowPreparing(false)
                setPlaybackState("error")
              },
            },
          })
        })
        .catch(() => {
          pendingPlayRef.current = false
          setShowPreparing(false)
          setPlaybackState("error")
        })
    },
    [
      applyIframeStyles,
      clearPausedRecovery,
      clearPlaybackCheck,
      clearPreparingTimer,
      cuePreparedVideo,
      onEnded,
      playWithSound,
      visible,
    ],
  )

  const stop = useCallback(() => {
    pendingPlayRef.current = false
    isPlayingRef.current = false
    internalStopRef.current = true
    clearPlaybackCheck()
    clearPreparingTimer()
    clearPausedRecovery()
    setShowPreparing(false)

    try {
      playerRef.current?.mute?.()
      playerRef.current?.stopVideo?.()
    } catch {
      // Best-effort cleanup for the cross-origin iframe player.
    }

    setPlaybackState(preparedVideoIdRef.current ? "ready" : "idle")
  }, [clearPausedRecovery, clearPlaybackCheck, clearPreparingTimer])

  const reset = useCallback(() => {
    stop()
    pendingVideoIdRef.current = null
    preparedVideoIdRef.current = null
    setPlaybackState("idle")
  }, [stop])

  useImperativeHandle(
    ref,
    () => ({
      prepare,
      playWithSound,
      stop,
      reset,
    }),
    [prepare, playWithSound, reset, stop],
  )

  useEffect(() => {
    if (!active || !videoUrl) return
    prepare(videoUrl)
  }, [active, prepare, videoUrl])

  useEffect(() => {
    if (!visible || !active || !autoPlayWhenVisible) return
    playWithSound()
  }, [active, autoPlayWhenVisible, playWithSound, visible])

  useEffect(
    () => () => {
      clearPlaybackCheck()
      clearPreparingTimer()
      clearPausedRecovery()
      try {
        playerRef.current?.destroy?.()
      } catch {
        // Best-effort cleanup for the cross-origin iframe player.
      }
      playerRef.current = null
    },
    [clearPausedRecovery, clearPlaybackCheck, clearPreparingTimer],
  )

  const showFallback = visible && (playbackState === "blocked" || playbackState === "error")

  return (
    <section
      className={cn(
        "absolute inset-0 z-0 flex min-h-[100dvh] w-full justify-center overflow-hidden bg-black text-white transition-opacity duration-300",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!visible}
    >
      <div className="relative h-[100dvh] min-h-[100dvh] w-full max-w-[460px] overflow-hidden bg-black">
        <div className="absolute inset-0 overflow-hidden bg-black">
          <div
            className="absolute left-1/2 top-1/2 aspect-[9/16] h-full max-h-full overflow-hidden"
            style={{
              width: "min(100%, calc(100dvh * 9 / 16))",
              transform: `translate(calc(-50% + ${iframeOffsetX}px), calc(-50% + ${iframeOffsetY}px)) scale(${iframeScale})`,
              transformOrigin: "center center",
            }}
          >
            <div ref={playerHostRef} className="absolute inset-0 h-full w-full" />
          </div>
        </div>

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

        {logoMaskEnabled ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-30"
            style={{
              left: `${logoMaskX}%`,
              top: `${logoMaskY}%`,
              width: `${logoMaskWidth}px`,
              height: `${logoMaskHeight}px`,
              transform: "translate(-50%, -50%)",
              borderRadius: `${logoMaskRadius}px`,
              background:
                "radial-gradient(circle at center, rgba(0,0,0,0.96) 0%, rgba(0,0,0,0.92) 52%, rgba(0,0,0,0) 76%)",
              backdropFilter: "blur(2px)",
            }}
          />
        ) : null}

        <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-28 bg-gradient-to-b from-black/55 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40 bg-gradient-to-t from-black/70 to-transparent" />

        <div
          className="absolute inset-0 z-40 cursor-default bg-transparent [touch-action:none]"
          aria-hidden="true"
          onClick={stopEvent}
          onDoubleClick={stopEvent}
          onPointerDown={stopEvent}
        />

        {visible && showPreparing && !showFallback ? (
          <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-black/24 px-6 text-center backdrop-blur-[1px]">
            <p className="rounded-full border border-gold/25 bg-black/45 px-5 py-3 font-serif text-sm uppercase tracking-[0.22em] text-[#f5eedc]/90">
              Preparando mensaje...
            </p>
          </div>
        ) : null}

        {showFallback ? (
          <div className="absolute inset-0 z-[60] flex items-center justify-center bg-black/62 px-6 backdrop-blur-[2px]">
            <button
              type="button"
              onClick={playWithSound}
              className="flex max-w-full flex-wrap items-center justify-center gap-2 rounded-full bg-gold px-5 py-4 text-center text-sm font-semibold uppercase leading-tight tracking-[0.14em] text-background shadow-xl shadow-gold/20 transition-transform active:scale-95"
            >
              <Play className="size-4 fill-current" />
              {fallbackLabel}
            </button>
          </div>
        ) : null}
      </div>
    </section>
  )
})
