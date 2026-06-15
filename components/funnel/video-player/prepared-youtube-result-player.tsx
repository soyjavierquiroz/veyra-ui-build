"use client"

import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react"
import { cn } from "@/lib/utils"
import { extractYouTubeVideoId } from "./youtube-utils"
import {
  ensureYouTubePreconnects,
  preloadYouTubeIframeApi,
} from "./youtube-shorts-vsl-player"

export type ResultLogoMaskMode = "off" | "soft" | "solid"
export type ResultYouTubeFitMode = "cover" | "contain" | "native"

export type PreparedYouTubeResultPlayerHandle = {
  prepare: (videoUrl: string) => void
  playWithSound: () => void
  stop: () => void
  reset: () => void
  isReady: () => boolean
}

export type PreparedYouTubeResultPlayerProps = {
  videoUrl: string | null
  active: boolean
  visible: boolean
  armed?: boolean
  fitMode?: ResultYouTubeFitMode
  verticalMode?: boolean
  iframeScale?: number
  iframeOffsetX?: number
  iframeOffsetY?: number
  maskTop?: number
  maskBottom?: number
  maskLeft?: number
  maskRight?: number
  logoMaskEnabled?: boolean
  logoMaskMode?: ResultLogoMaskMode
  logoMaskX?: number
  logoMaskY?: number
  logoMaskWidth?: number
  logoMaskHeight?: number
  logoMaskRadius?: number
  logoMaskBlur?: number
  logoMaskOpacity?: number
  bottomUiShieldEnabled?: boolean
  bottomUiShieldHeight?: number
  bottomUiShieldOpacity?: number
  topUiShieldEnabled?: boolean
  topUiShieldHeight?: number
  topUiShieldOpacity?: number
  posterShieldEnabled?: boolean
  introVeilEnabled?: boolean
  introVeilDurationMs?: number
  introVeilFadeMs?: number
  shouldPlay?: boolean
  revealRequested?: boolean
  onReadyToReveal?: () => void
  onPlaying?: () => void
  onPlaybackFailed?: () => void
  onEnded?: () => void
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

const PLAYBACK_CHECK_DELAY_MS = 4000
const YOUTUBE_MAXRES_POSTER = "maxresdefault"
const YOUTUBE_HQ_POSTER = "hqdefault"

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getYouTubePosterUrl(videoId: string, quality: string) {
  return `https://i.ytimg.com/vi/${videoId}/${quality}.jpg`
}

export const PreparedYouTubeResultPlayer = forwardRef<
  PreparedYouTubeResultPlayerHandle,
  PreparedYouTubeResultPlayerProps
>(function PreparedYouTubeResultPlayer(
  {
    videoUrl,
    active,
    visible,
    armed = true,
    fitMode = "native",
    verticalMode = true,
    iframeScale = 1,
    iframeOffsetX = 0,
    iframeOffsetY = 0,
    maskTop = 0,
    maskBottom = 0,
    maskLeft = 0,
    maskRight = 0,
    logoMaskEnabled = true,
    logoMaskMode = "off",
    logoMaskX = 50,
    logoMaskY = 49,
    logoMaskWidth = 132,
    logoMaskHeight = 44,
    logoMaskRadius = 999,
    logoMaskBlur = 14,
    logoMaskOpacity = 0.22,
    bottomUiShieldEnabled = false,
    bottomUiShieldHeight = 150,
    bottomUiShieldOpacity = 0.82,
    topUiShieldEnabled = false,
    topUiShieldHeight = 96,
    topUiShieldOpacity = 0.45,
    posterShieldEnabled = false,
    introVeilEnabled = true,
    introVeilDurationMs = 3000,
    introVeilFadeMs = 900,
    shouldPlay = false,
    revealRequested = false,
    onReadyToReveal,
    onPlaying,
    onPlaybackFailed,
    onEnded,
  },
  ref,
) {
  const playerHostRef = useRef<HTMLDivElement | null>(null)
  const playerRef = useRef<YouTubePlayer | null>(null)
  const preparedVideoIdRef = useRef<string | null>(null)
  const pendingVideoIdRef = useRef<string | null>(null)
  const pendingPlayRef = useRef(false)
  const revealAttemptedRef = useRef(false)
  const readyToRevealRef = useRef(false)
  const bufferingRef = useRef(false)
  const playbackCheckTimeoutRef = useRef<number | null>(null)
  const pausedRecoveryTimeoutRef = useRef<number | null>(null)
  const introVeilFadeTimeoutRef = useRef<number | null>(null)
  const introVeilUnmountTimeoutRef = useRef<number | null>(null)
  const isPlayingRef = useRef(false)
  const internalStopRef = useRef(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
  const [posterQuality, setPosterQuality] = useState(YOUTUBE_MAXRES_POSTER)
  const [introVeilMounted, setIntroVeilMounted] = useState(false)
  const [introVeilVisible, setIntroVeilVisible] = useState(false)
  const videoId = useMemo(
    () => (videoUrl ? extractYouTubeVideoId(videoUrl) : null),
    [videoUrl],
  )

  const clearPlaybackCheck = useCallback(() => {
    if (playbackCheckTimeoutRef.current === null) return
    window.clearTimeout(playbackCheckTimeoutRef.current)
    playbackCheckTimeoutRef.current = null
  }, [])

  const clearPausedRecovery = useCallback(() => {
    if (pausedRecoveryTimeoutRef.current === null) return
    window.clearTimeout(pausedRecoveryTimeoutRef.current)
    pausedRecoveryTimeoutRef.current = null
  }, [])

  const clearIntroVeilTimers = useCallback(() => {
    if (introVeilFadeTimeoutRef.current !== null) {
      window.clearTimeout(introVeilFadeTimeoutRef.current)
      introVeilFadeTimeoutRef.current = null
    }

    if (introVeilUnmountTimeoutRef.current !== null) {
      window.clearTimeout(introVeilUnmountTimeoutRef.current)
      introVeilUnmountTimeoutRef.current = null
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
    iframe.style.pointerEvents = "none"
  }, [])

  const markReadyToReveal = useCallback(() => {
    readyToRevealRef.current = true
    setPlaybackState("ready")
    onReadyToReveal?.()
  }, [onReadyToReveal])

  const reportPlaybackFailed = useCallback(() => {
    pendingPlayRef.current = false
    isPlayingRef.current = false
    bufferingRef.current = false
    setPlaybackState("blocked")
    onPlaybackFailed?.()
  }, [onPlaybackFailed])

  const schedulePlaybackCheck = useCallback(() => {
    clearPlaybackCheck()
    playbackCheckTimeoutRef.current = window.setTimeout(() => {
      if (isPlayingRef.current) return
      if (bufferingRef.current) {
        schedulePlaybackCheck()
        return
      }

      reportPlaybackFailed()
    }, PLAYBACK_CHECK_DELAY_MS)
  }, [clearPlaybackCheck, reportPlaybackFailed])

  const showIntroVeil = useCallback(() => {
    clearIntroVeilTimers()

    if (!visible || !introVeilEnabled) {
      setIntroVeilVisible(false)
      setIntroVeilMounted(false)
      return
    }

    const safeDuration = Math.max(introVeilDurationMs, 0)
    const safeFade = Math.max(introVeilFadeMs, 0)
    const visibleDuration = Math.max(safeDuration - safeFade, 0)

    setIntroVeilMounted(true)
    setIntroVeilVisible(true)

    introVeilFadeTimeoutRef.current = window.setTimeout(() => {
      setIntroVeilVisible(false)
    }, visibleDuration)

    introVeilUnmountTimeoutRef.current = window.setTimeout(() => {
      setIntroVeilMounted(false)
    }, safeDuration)
  }, [
    clearIntroVeilTimers,
    introVeilDurationMs,
    introVeilEnabled,
    introVeilFadeMs,
    visible,
  ])

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
        markReadyToReveal()
        return true
      } catch {
        readyToRevealRef.current = false
        setPlaybackState("error")
        return false
      }
    },
    [markReadyToReveal],
  )

  const playWithSound = useCallback((showVeil = true) => {
    revealAttemptedRef.current = true
    pendingPlayRef.current = true
    bufferingRef.current = false
    setPlaybackState("preparing")

    const player = playerRef.current
    if (!player) return

    try {
      internalStopRef.current = false
      if (showVeil) showIntroVeil()
      player.unMute?.()
      player.setVolume?.(100)
      player.playVideo?.()
      schedulePlaybackCheck()
    } catch {
      reportPlaybackFailed()
    }
  }, [reportPlaybackFailed, schedulePlaybackCheck, showIntroVeil])

  const prepare = useCallback(
    (nextVideoUrl: string) => {
      const nextVideoId = extractYouTubeVideoId(nextVideoUrl)
      if (!nextVideoId || !playerHostRef.current) return

      ensureYouTubePreconnects()

      if (preparedVideoIdRef.current === nextVideoId && playerRef.current) {
        markReadyToReveal()
        return
      }

      pendingVideoIdRef.current = nextVideoId
      readyToRevealRef.current = false
      bufferingRef.current = false
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
                  bufferingRef.current = false
                  clearPlaybackCheck()
                  clearPausedRecovery()
                  setPlaybackState("playing")
                  onPlaying?.()
                  return
                }

                if (state === YT.PlayerState.ENDED) {
                  pendingPlayRef.current = false
                  isPlayingRef.current = false
                  bufferingRef.current = false
                  internalStopRef.current = true
                  clearPlaybackCheck()
                  clearPausedRecovery()
                  setPlaybackState("ended")
                  onEnded?.()
                  return
                }

                if (state === YT.PlayerState.BUFFERING) {
                  bufferingRef.current = true
                  return
                }

                if (state === YT.PlayerState.CUED) {
                  bufferingRef.current = false
                  if (!isPlayingRef.current && preparedVideoIdRef.current) {
                    markReadyToReveal()
                  }
                  return
                }

                if (state === YT.PlayerState.PAUSED) {
                  isPlayingRef.current = false
                  bufferingRef.current = false
                  if (visible && !internalStopRef.current) {
                    clearPausedRecovery()
                    pausedRecoveryTimeoutRef.current = window.setTimeout(() => {
                      playWithSound(false)
                    }, 250)
                  }
                }
              },
              onError: () => {
                pendingPlayRef.current = false
                isPlayingRef.current = false
                bufferingRef.current = false
                clearPlaybackCheck()
                clearPausedRecovery()
                setPlaybackState("error")
                if (revealAttemptedRef.current) {
                  reportPlaybackFailed()
                }
              },
            },
          })
        })
        .catch(() => {
          pendingPlayRef.current = false
          setPlaybackState("error")
        })
    },
    [
      applyIframeStyles,
      clearPausedRecovery,
      clearPlaybackCheck,
      cuePreparedVideo,
      markReadyToReveal,
      onEnded,
      onPlaying,
      playWithSound,
      reportPlaybackFailed,
      visible,
    ],
  )

  const stop = useCallback(() => {
    pendingPlayRef.current = false
    isPlayingRef.current = false
    bufferingRef.current = false
    internalStopRef.current = true
    clearPlaybackCheck()
    clearPausedRecovery()

    try {
      playerRef.current?.mute?.()
      playerRef.current?.stopVideo?.()
    } catch {
      // Best-effort cleanup for the cross-origin iframe player.
    }

    setPlaybackState(preparedVideoIdRef.current ? "ready" : "idle")
  }, [clearPausedRecovery, clearPlaybackCheck])

  const reset = useCallback(() => {
    stop()
    pendingVideoIdRef.current = null
    preparedVideoIdRef.current = null
    readyToRevealRef.current = false
    revealAttemptedRef.current = false
    bufferingRef.current = false
    clearIntroVeilTimers()
    setIntroVeilVisible(false)
    setIntroVeilMounted(false)
    setPlaybackState("idle")
  }, [clearIntroVeilTimers, stop])

  useImperativeHandle(
    ref,
    () => ({
      prepare,
      playWithSound,
      stop,
      reset,
      isReady: () => readyToRevealRef.current,
    }),
    [prepare, playWithSound, reset, stop],
  )

  useEffect(() => {
    if (!active || !videoUrl) return
    prepare(videoUrl)
  }, [active, prepare, videoUrl])

  useEffect(() => {
    if (
      !visible ||
      !active ||
      !armed ||
      !shouldPlay ||
      revealRequested === false
    ) {
      return
    }
    playWithSound()
  }, [active, armed, playWithSound, revealRequested, shouldPlay, visible])

  useEffect(() => {
    if (visible) return

    setIntroVeilVisible(false)
    setIntroVeilMounted(false)
  }, [visible])

  useEffect(() => {
    setPosterQuality(YOUTUBE_MAXRES_POSTER)
  }, [videoId])

  useEffect(
    () => () => {
      clearPlaybackCheck()
      clearPausedRecovery()
      clearIntroVeilTimers()
      try {
        playerRef.current?.destroy?.()
      } catch {
        // Best-effort cleanup for the cross-origin iframe player.
      }
      playerRef.current = null
    },
    [clearIntroVeilTimers, clearPausedRecovery, clearPlaybackCheck],
  )

  const posterUrl =
    posterShieldEnabled && videoId
      ? getYouTubePosterUrl(videoId, posterQuality)
      : null
  const showPosterShield =
    Boolean(posterShieldEnabled && posterUrl && visible && playbackState !== "playing")
  const safeIframeScale = Number.isFinite(iframeScale) ? iframeScale : 1
  const safeIframeOffsetX = Number.isFinite(iframeOffsetX) ? iframeOffsetX : 0
  const safeIframeOffsetY = Number.isFinite(iframeOffsetY) ? iframeOffsetY : 0
  const shouldTransformNativeIframe =
    safeIframeScale !== 1 || safeIframeOffsetX !== 0 || safeIframeOffsetY !== 0
  const shouldShowLogoMask = logoMaskEnabled && logoMaskMode !== "off"
  const safeLogoMaskOpacity = clamp(logoMaskOpacity, 0, 1)
  const safeLogoMaskBlur = Math.max(logoMaskBlur, 0)
  const safeBottomUiShieldOpacity = clamp(bottomUiShieldOpacity, 0, 1)
  const safeTopUiShieldOpacity = clamp(topUiShieldOpacity, 0, 1)
  const logoMaskStyle =
    logoMaskMode === "solid"
      ? {
          left: `${logoMaskX}%`,
          top: `${logoMaskY}%`,
          width: `${logoMaskWidth}px`,
          height: `${logoMaskHeight}px`,
          transform: "translate(-50%, -50%)",
          borderRadius: `${logoMaskRadius}px`,
          background:
            "radial-gradient(ellipse at center, rgba(0,0,0,0.58) 0%, rgba(0,0,0,0.4) 44%, rgba(0,0,0,0) 78%)",
          backdropFilter: "blur(8px)",
          WebkitBackdropFilter: "blur(8px)",
          maskImage:
            "radial-gradient(ellipse at center, #000 0%, #000 44%, rgba(0,0,0,0.45) 64%, transparent 84%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, #000 0%, #000 44%, rgba(0,0,0,0.45) 64%, transparent 84%)",
        }
      : {
          left: `${logoMaskX}%`,
          top: `${logoMaskY}%`,
          width: `${logoMaskWidth}px`,
          height: `${logoMaskHeight}px`,
          transform: "translate(-50%, -50%)",
          borderRadius: `${logoMaskRadius}px`,
          background: `radial-gradient(ellipse at center, rgba(0,0,0,${safeLogoMaskOpacity}) 0%, rgba(0,0,0,${
            safeLogoMaskOpacity * 0.68
          }) 32%, rgba(0,0,0,${
            safeLogoMaskOpacity * 0.28
          }) 58%, rgba(0,0,0,0) 78%)`,
          backdropFilter: `blur(${safeLogoMaskBlur}px) saturate(0.85) brightness(0.72)`,
          WebkitBackdropFilter: `blur(${safeLogoMaskBlur}px) saturate(0.85) brightness(0.72)`,
          maskImage:
            "radial-gradient(ellipse at center, #000 0%, #000 42%, rgba(0,0,0,0.55) 62%, transparent 82%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, #000 0%, #000 42%, rgba(0,0,0,0.55) 62%, transparent 82%)",
        }

  return (
    <section
      className={cn(
        "absolute inset-0 z-0 flex min-h-[100dvh] w-full justify-center overflow-hidden bg-black text-white transition-opacity duration-300",
        visible ? "opacity-100" : "pointer-events-none opacity-0",
      )}
      aria-hidden={!visible}
    >
      <div className="relative h-[100dvh] min-h-[100dvh] w-full max-w-[460px] overflow-hidden bg-black">
        <div
          className="absolute inset-0 h-full w-full overflow-hidden bg-black"
          data-fit-mode={fitMode}
          data-vertical-mode={verticalMode ? "true" : "false"}
        >
          {fitMode === "cover" ? (
            <div
              className="absolute left-1/2 top-1/2 aspect-[9/16] h-full max-h-full overflow-hidden"
              style={{
                width: "min(100%, calc(100dvh * 9 / 16))",
                transform: `translate(calc(-50% + ${safeIframeOffsetX}px), calc(-50% + ${safeIframeOffsetY}px)) scale(${safeIframeScale})`,
                transformOrigin: "center center",
              }}
            >
              <div ref={playerHostRef} className="absolute inset-0 h-full w-full" />
            </div>
          ) : (
            <div
              ref={playerHostRef}
              className="absolute inset-0 h-full w-full overflow-hidden"
              style={
                shouldTransformNativeIframe
                  ? {
                      transform: `translate(${safeIframeOffsetX}px, ${safeIframeOffsetY}px) scale(${safeIframeScale})`,
                      transformOrigin: "center center",
                    }
                  : undefined
              }
            />
          )}
        </div>

        <div
          className="pointer-events-none absolute left-0 right-0 top-0 z-20 bg-black"
          style={{ height: `${Math.max(maskTop, 0)}px` }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 right-0 z-20 bg-black"
          style={{
            height: `${Math.max(maskBottom, 0)}px`,
            background:
              "linear-gradient(to top, rgba(0,0,0,0.68), rgba(0,0,0,0.28), transparent)",
          }}
        />
        <div
          className="pointer-events-none absolute bottom-0 left-0 top-0 z-20 bg-black"
          style={{ width: `${Math.max(maskLeft, 0)}px` }}
        />
        <div
          className="pointer-events-none absolute bottom-0 right-0 top-0 z-20 bg-black"
          style={{ width: `${Math.max(maskRight, 0)}px` }}
        />

        {shouldShowLogoMask ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute z-30"
            style={logoMaskStyle}
          />
        ) : null}

        {posterShieldEnabled && posterUrl ? (
          <img
            aria-hidden="true"
            alt=""
            src={posterUrl}
            className={cn(
              "pointer-events-none absolute inset-0 z-20 h-full w-full object-cover object-center transition-opacity duration-500",
              showPosterShield ? "opacity-100" : "opacity-0",
            )}
            onError={() => {
              if (posterQuality !== YOUTUBE_HQ_POSTER) {
                setPosterQuality(YOUTUBE_HQ_POSTER)
              }
            }}
          />
        ) : null}

        {topUiShieldEnabled ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 z-30"
            style={{
              height: `${Math.max(topUiShieldHeight, 0)}px`,
              background: `linear-gradient(to bottom, rgba(0,0,0,${safeTopUiShieldOpacity}), rgba(0,0,0,${
                safeTopUiShieldOpacity * 0.32
              }) 54%, rgba(0,0,0,0) 100%)`,
            }}
          />
        ) : null}
        {bottomUiShieldEnabled ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 bottom-0 z-30"
            style={{
              height: `${Math.max(bottomUiShieldHeight, 0)}px`,
              background: `linear-gradient(to top, rgba(0,0,0,${safeBottomUiShieldOpacity}) 0%, rgba(0,0,0,${
                safeBottomUiShieldOpacity * 0.62
              }) 38%, rgba(0,0,0,${
                safeBottomUiShieldOpacity * 0.22
              }) 68%, rgba(0,0,0,0) 100%)`,
            }}
          />
        ) : null}

        {introVeilMounted ? (
          <div
            aria-hidden="true"
            className={cn(
              "pointer-events-none absolute inset-0 z-30 transition-opacity ease-out",
              introVeilVisible ? "opacity-100" : "opacity-0",
            )}
            style={{
              transitionDuration: `${Math.max(introVeilFadeMs, 0)}ms`,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.72) 0%, rgba(0,0,0,0.18) 24%, rgba(0,0,0,0.06) 58%, rgba(0,0,0,0.72) 100%)",
            }}
          />
        ) : null}

        <div
          className="absolute inset-0 z-40 cursor-default bg-transparent [touch-action:none]"
          aria-hidden="true"
        />
      </div>
    </section>
  )
})
