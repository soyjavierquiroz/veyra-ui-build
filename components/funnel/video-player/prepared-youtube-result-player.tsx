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
  startMutedPreroll: () => void
  revealWithSound: () => void
  playWithSound: () => void
  stop: () => void
  reset: () => void
  isReadyToReveal: () => boolean
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
  introVeilOpacity?: number
  onReadyToReveal?: () => void
  onPlaying?: () => void
  onPlaybackFailed?: () => void
  onEnded?: () => void
}

type PlaybackState =
  | "idle"
  | "loading"
  | "muted-preroll"
  | "muted-playing"
  | "ready-to-reveal"
  | "revealing"
  | "playing-with-sound"
  | "ended"
  | "error"

type YouTubePlayer = {
  cueVideoById?: (videoId: string) => void
  destroy?: () => void
  getIframe?: () => HTMLIFrameElement
  getPlayerState?: () => number
  loadVideoById?: (
    video:
      | string
      | {
          videoId: string
          startSeconds?: number
        },
  ) => void
  mute?: () => void
  playVideo?: () => void
  seekTo?: (seconds: number, allowSeekAhead: boolean) => void
  stopVideo?: () => void
  unMute?: () => void
  setVolume?: (volume: number) => void
}

type YouTubeEvent = {
  data: number
  target: YouTubePlayer
}

const REVEAL_PLAYBACK_CHECK_MS = 4000
const MANUAL_REVEAL_DELAY_MS = 2800
const MUTED_PREROLL_RETRY_MS = 800
const YOUTUBE_STATE_UNSTARTED = -1
const YOUTUBE_STATE_ENDED = 0
const YOUTUBE_STATE_PAUSED = 2
const YOUTUBE_STATE_CUED = 5
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
    introVeilOpacity = 0.92,
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
  const revealRequestedRef = useRef(false)
  const hasRevealedWithSoundRef = useRef(false)
  const hasSoundPlaybackConfirmedRef = useRef(false)
  const readyToRevealRef = useRef(false)
  const mutedPrerollRetryCountRef = useRef(0)
  const bufferingRef = useRef(false)
  const playbackCheckTimeoutRef = useRef<number | null>(null)
  const manualRevealTimeoutRef = useRef<number | null>(null)
  const mutedPrerollRetryTimeoutRef = useRef<number | null>(null)
  const pausedRecoveryTimeoutRef = useRef<number | null>(null)
  const introVeilFadeTimeoutRef = useRef<number | null>(null)
  const introVeilUnmountTimeoutRef = useRef<number | null>(null)
  const isSoundPlayingRef = useRef(false)
  const internalStopRef = useRef(false)
  const [playbackState, setPlaybackState] = useState<PlaybackState>("idle")
  const [posterQuality, setPosterQuality] = useState(YOUTUBE_MAXRES_POSTER)
  const [introVeilMounted, setIntroVeilMounted] = useState(false)
  const [introVeilVisible, setIntroVeilVisible] = useState(false)
  const videoId = useMemo(
    () => (videoUrl ? extractYouTubeVideoId(videoUrl) : null),
    [videoUrl],
  )
  const debugEnabled = useMemo(() => {
    if (process.env.NEXT_PUBLIC_RESULT_YOUTUBE_DEBUG === "true") return true
    if (typeof window === "undefined") return false

    return new URLSearchParams(window.location.search).get("ytDebug") === "1"
  }, [])

  const debugLog = useCallback(
    (message: string, details?: unknown) => {
      if (!debugEnabled) return

      if (details === undefined) {
        console.info(`[result-youtube] ${message}`)
        return
      }

      console.info(`[result-youtube] ${message}`, details)
    },
    [debugEnabled],
  )

  const clearPlaybackCheck = useCallback(() => {
    if (playbackCheckTimeoutRef.current === null) return
    window.clearTimeout(playbackCheckTimeoutRef.current)
    playbackCheckTimeoutRef.current = null
  }, [])

  const clearMutedPrerollRetry = useCallback(() => {
    if (mutedPrerollRetryTimeoutRef.current === null) return
    window.clearTimeout(mutedPrerollRetryTimeoutRef.current)
    mutedPrerollRetryTimeoutRef.current = null
  }, [])

  const clearManualRevealTimeout = useCallback(() => {
    if (manualRevealTimeoutRef.current === null) return
    window.clearTimeout(manualRevealTimeoutRef.current)
    manualRevealTimeoutRef.current = null
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

    iframe.setAttribute(
      "allow",
      "autoplay; encrypted-media; picture-in-picture; fullscreen",
    )
    iframe.setAttribute("allowfullscreen", "false")
    iframe.style.position = "absolute"
    iframe.style.inset = "0"
    iframe.style.width = "100%"
    iframe.style.height = "100%"
    iframe.style.minWidth = "100%"
    iframe.style.minHeight = "100%"
    iframe.style.border = "0"
    iframe.style.pointerEvents = "none"
    debugLog("iframe allow/style patched")
  }, [debugLog])

  const loadPlayerVideoFromStart = useCallback(
    (player: YouTubePlayer, targetVideoId: string) => {
      if (player.loadVideoById) {
        player.loadVideoById({
          videoId: targetVideoId,
          startSeconds: 0,
        })
        return
      }

      player.cueVideoById?.(targetVideoId)
    },
    [],
  )

  const markReadyToReveal = useCallback((reason: string) => {
    if (readyToRevealRef.current) return

    clearManualRevealTimeout()
    readyToRevealRef.current = true
    setPlaybackState("ready-to-reveal")
    debugLog("readyToReveal", { reason })
    onReadyToReveal?.()
  }, [clearManualRevealTimeout, debugLog, onReadyToReveal])

  const scheduleManualRevealTimeout = useCallback(() => {
    if (manualRevealTimeoutRef.current !== null) return

    manualRevealTimeoutRef.current = window.setTimeout(() => {
      manualRevealTimeoutRef.current = null
      if (readyToRevealRef.current || revealRequestedRef.current) return

      markReadyToReveal("manual-timeout")
    }, MANUAL_REVEAL_DELAY_MS)
  }, [markReadyToReveal])

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

  const reportPlaybackFailed = useCallback(() => {
    revealRequestedRef.current = false
    hasRevealedWithSoundRef.current = false
    hasSoundPlaybackConfirmedRef.current = false
    isSoundPlayingRef.current = false
    bufferingRef.current = false
    readyToRevealRef.current = true
    setPlaybackState("ready-to-reveal")
    debugLog("reveal timeout/failure")
    onPlaybackFailed?.()
  }, [debugLog, onPlaybackFailed])

  const scheduleRevealPlaybackCheck = useCallback(() => {
    clearPlaybackCheck()
    playbackCheckTimeoutRef.current = window.setTimeout(() => {
      if (isSoundPlayingRef.current) return
      if (bufferingRef.current) {
        scheduleRevealPlaybackCheck()
        return
      }

      reportPlaybackFailed()
    }, REVEAL_PLAYBACK_CHECK_MS)
  }, [clearPlaybackCheck, reportPlaybackFailed])

  const startMutedPreroll = useCallback(() => {
    const player = playerRef.current
    if (!player || !preparedVideoIdRef.current || !armed) return

    clearPlaybackCheck()
    clearPausedRecovery()
    clearMutedPrerollRetry()
    revealRequestedRef.current = false
    hasRevealedWithSoundRef.current = false
    hasSoundPlaybackConfirmedRef.current = false
    isSoundPlayingRef.current = false
    bufferingRef.current = false
    internalStopRef.current = false
    setPlaybackState("muted-preroll")
    scheduleManualRevealTimeout()
    debugLog("muted preroll start", { videoId: preparedVideoIdRef.current })

    try {
      player.mute?.()
      player.setVolume?.(0)
      player.playVideo?.()
    } catch {
      setPlaybackState("error")
      return
    }

    if (mutedPrerollRetryCountRef.current > 0) return

    mutedPrerollRetryTimeoutRef.current = window.setTimeout(() => {
      mutedPrerollRetryTimeoutRef.current = null
      if (readyToRevealRef.current || revealRequestedRef.current) return

      mutedPrerollRetryCountRef.current += 1
      try {
        player.mute?.()
        player.setVolume?.(0)
        player.playVideo?.()
        debugLog("muted preroll retry")
      } catch {
        setPlaybackState("error")
      }
    }, MUTED_PREROLL_RETRY_MS)
  }, [
    armed,
    clearMutedPrerollRetry,
    clearPausedRecovery,
    clearPlaybackCheck,
    debugLog,
    scheduleManualRevealTimeout,
  ])

  const loadVideoForMutedPreroll = useCallback(
    (targetVideoId: string) => {
      const player = playerRef.current
      if (!player) return false

      clearManualRevealTimeout()
      readyToRevealRef.current = false
      mutedPrerollRetryCountRef.current = 0
      preparedVideoIdRef.current = targetVideoId
      pendingVideoIdRef.current = null
      internalStopRef.current = false

      try {
        player.mute?.()
        player.setVolume?.(0)
        if (armed) {
          loadPlayerVideoFromStart(player, targetVideoId)
        } else {
          player.cueVideoById?.(targetVideoId)
          debugLog("muted preroll cued until EXP 5 is armed", {
            videoId: targetVideoId,
          })
        }
      } catch {
        setPlaybackState("error")
        return false
      }

      startMutedPreroll()
      return true
    },
    [
      armed,
      clearManualRevealTimeout,
      debugLog,
      loadPlayerVideoFromStart,
      startMutedPreroll,
    ],
  )

  const revealWithSound = useCallback(() => {
    const player = playerRef.current
    const targetVideoId = preparedVideoIdRef.current ?? videoId

    if (!player || !targetVideoId) {
      debugLog("reveal click failed: player/video missing")
      onPlaybackFailed?.()
      return
    }

    clearPlaybackCheck()
    clearManualRevealTimeout()
    clearPausedRecovery()
    clearMutedPrerollRetry()
    revealRequestedRef.current = true
    hasRevealedWithSoundRef.current = true
    hasSoundPlaybackConfirmedRef.current = false
    isSoundPlayingRef.current = false
    bufferingRef.current = false
    internalStopRef.current = false
    setPlaybackState("revealing")
    showIntroVeil()

    try {
      const state = player.getPlayerState?.()
      debugLog("reveal click", { state })

      if (
        state === YOUTUBE_STATE_UNSTARTED ||
        state === YOUTUBE_STATE_CUED ||
        state === YOUTUBE_STATE_PAUSED ||
        state === YOUTUBE_STATE_ENDED ||
        typeof state !== "number"
      ) {
        loadPlayerVideoFromStart(player, targetVideoId)
      } else {
        player.seekTo?.(0, true)
      }

      player.seekTo?.(0, true)
      player.unMute?.()
      player.setVolume?.(100)
      player.playVideo?.()
      scheduleRevealPlaybackCheck()
    } catch {
      reportPlaybackFailed()
    }
  }, [
    clearManualRevealTimeout,
    clearMutedPrerollRetry,
    clearPausedRecovery,
    clearPlaybackCheck,
    debugLog,
    loadPlayerVideoFromStart,
    onPlaybackFailed,
    reportPlaybackFailed,
    scheduleRevealPlaybackCheck,
    showIntroVeil,
    videoId,
  ])

  const prepare = useCallback(
    (nextVideoUrl: string) => {
      const nextVideoId = extractYouTubeVideoId(nextVideoUrl)
      if (!nextVideoId || !playerHostRef.current) return

      ensureYouTubePreconnects()

      if (preparedVideoIdRef.current === nextVideoId && playerRef.current) {
        if (!readyToRevealRef.current && !hasRevealedWithSoundRef.current) {
          startMutedPreroll()
        }
        return
      }

      pendingVideoIdRef.current = nextVideoId
      clearManualRevealTimeout()
      readyToRevealRef.current = false
      revealRequestedRef.current = false
      hasRevealedWithSoundRef.current = false
      hasSoundPlaybackConfirmedRef.current = false
      isSoundPlayingRef.current = false
      bufferingRef.current = false
      mutedPrerollRetryCountRef.current = 0
      setPlaybackState("loading")

      void preloadYouTubeIframeApi()
        .then((YT) => {
          if (!playerHostRef.current) return

          if (playerRef.current) {
            loadVideoForMutedPreroll(nextVideoId)
            return
          }

          playerRef.current = new YT.Player(playerHostRef.current, {
            videoId: nextVideoId,
            width: "100%",
            height: "100%",
            playerVars: {
              autoplay: 1,
              mute: 1,
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
                debugLog("onReady", { videoId: nextVideoId })
                applyIframeStyles(event.target)
                playerRef.current = event.target
                loadVideoForMutedPreroll(nextVideoId)
              },
              onStateChange: (event: YouTubeEvent) => {
                const state = event.data
                applyIframeStyles(event.target)
                debugLog("state change", { state })

                if (state === YT.PlayerState.PLAYING) {
                  clearManualRevealTimeout()
                  clearMutedPrerollRetry()
                  bufferingRef.current = false

                  if (revealRequestedRef.current) {
                    isSoundPlayingRef.current = true
                    hasSoundPlaybackConfirmedRef.current = true
                    clearPlaybackCheck()
                    clearPausedRecovery()
                    setPlaybackState("playing-with-sound")
                    debugLog("reveal PLAYING")
                    onPlaying?.()
                    return
                  }

                  setPlaybackState("muted-playing")
                  markReadyToReveal("muted-playing")
                  return
                }

                if (state === YT.PlayerState.ENDED) {
                  clearPlaybackCheck()
                  clearPausedRecovery()
                  bufferingRef.current = false

                  if (hasSoundPlaybackConfirmedRef.current) {
                    debugLog("ended accepted after reveal")
                    revealRequestedRef.current = false
                    isSoundPlayingRef.current = false
                    internalStopRef.current = true
                    setPlaybackState("ended")
                    onEnded?.()
                    return
                  }

                  debugLog("ended ignored because not revealed")
                  try {
                    event.target.seekTo?.(0, true)
                  } catch {
                    // Best-effort only; a muted pre-roll end must not advance the funnel.
                  }
                  startMutedPreroll()
                  return
                }

                if (state === YT.PlayerState.BUFFERING) {
                  bufferingRef.current = true
                  return
                }

                if (state === YT.PlayerState.CUED) {
                  bufferingRef.current = false
                  if (!readyToRevealRef.current && !revealRequestedRef.current) {
                    startMutedPreroll()
                  }
                  return
                }

                if (state === YT.PlayerState.PAUSED) {
                  bufferingRef.current = false
                  if (!visible || internalStopRef.current) return

                  clearPausedRecovery()
                  pausedRecoveryTimeoutRef.current = window.setTimeout(() => {
                    if (revealRequestedRef.current) {
                      try {
                        playerRef.current?.playVideo?.()
                      } catch {
                        reportPlaybackFailed()
                      }
                      return
                    }

                    if (!hasRevealedWithSoundRef.current) {
                      startMutedPreroll()
                    }
                  }, 250)
                }
              },
              onError: () => {
                debugLog("onError")
                revealRequestedRef.current = false
                isSoundPlayingRef.current = false
                bufferingRef.current = false
                clearPlaybackCheck()
                clearManualRevealTimeout()
                clearMutedPrerollRetry()
                clearPausedRecovery()
                setPlaybackState("error")
                if (hasRevealedWithSoundRef.current) {
                  reportPlaybackFailed()
                }
              },
            },
          })
        })
        .catch(() => {
          revealRequestedRef.current = false
          setPlaybackState("error")
        })
    },
    [
      applyIframeStyles,
      clearManualRevealTimeout,
      clearMutedPrerollRetry,
      clearPausedRecovery,
      clearPlaybackCheck,
      debugLog,
      loadVideoForMutedPreroll,
      markReadyToReveal,
      onEnded,
      onPlaying,
      reportPlaybackFailed,
      startMutedPreroll,
      visible,
    ],
  )

  const stop = useCallback(() => {
    revealRequestedRef.current = false
    hasRevealedWithSoundRef.current = false
    hasSoundPlaybackConfirmedRef.current = false
    readyToRevealRef.current = false
    isSoundPlayingRef.current = false
    bufferingRef.current = false
    internalStopRef.current = true
    clearPlaybackCheck()
    clearManualRevealTimeout()
    clearMutedPrerollRetry()
    clearPausedRecovery()

    try {
      playerRef.current?.mute?.()
      playerRef.current?.stopVideo?.()
    } catch {
      // Best-effort cleanup for the cross-origin iframe player.
    }

    setPlaybackState(preparedVideoIdRef.current ? "loading" : "idle")
  }, [
    clearManualRevealTimeout,
    clearMutedPrerollRetry,
    clearPausedRecovery,
    clearPlaybackCheck,
  ])

  const reset = useCallback(() => {
    stop()
    pendingVideoIdRef.current = null
    preparedVideoIdRef.current = null
    readyToRevealRef.current = false
    revealRequestedRef.current = false
    hasRevealedWithSoundRef.current = false
    hasSoundPlaybackConfirmedRef.current = false
    bufferingRef.current = false
    mutedPrerollRetryCountRef.current = 0
    clearManualRevealTimeout()
    clearIntroVeilTimers()
    setIntroVeilVisible(false)
    setIntroVeilMounted(false)
    setPlaybackState("idle")
  }, [clearIntroVeilTimers, clearManualRevealTimeout, stop])

  useImperativeHandle(
    ref,
    () => ({
      prepare,
      startMutedPreroll,
      revealWithSound,
      playWithSound: revealWithSound,
      stop,
      reset,
      isReadyToReveal: () => readyToRevealRef.current,
      isReady: () => readyToRevealRef.current,
    }),
    [prepare, reset, revealWithSound, startMutedPreroll, stop],
  )

  useEffect(() => {
    if (!active || !videoUrl) return
    prepare(videoUrl)
  }, [active, prepare, videoUrl])

  useEffect(() => {
    if (!active || !armed || !videoId) return
    if (!playerRef.current || preparedVideoIdRef.current !== videoId) return
    if (readyToRevealRef.current || hasRevealedWithSoundRef.current) return

    loadVideoForMutedPreroll(videoId)
  }, [active, armed, loadVideoForMutedPreroll, videoId])

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
      clearManualRevealTimeout()
      clearMutedPrerollRetry()
      clearPausedRecovery()
      clearIntroVeilTimers()
      try {
        playerRef.current?.destroy?.()
      } catch {
        // Best-effort cleanup for the cross-origin iframe player.
      }
      playerRef.current = null
    },
    [
      clearIntroVeilTimers,
      clearManualRevealTimeout,
      clearMutedPrerollRetry,
      clearPausedRecovery,
      clearPlaybackCheck,
    ],
  )

  const posterUrl =
    posterShieldEnabled && videoId
      ? getYouTubePosterUrl(videoId, posterQuality)
      : null
  const showPosterShield = Boolean(
    posterShieldEnabled && posterUrl && visible && playbackState !== "playing-with-sound",
  )
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
  const safeIntroVeilOpacity = clamp(introVeilOpacity, 0, 1)
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
              opacity: introVeilVisible ? safeIntroVeilOpacity : 0,
              transitionDuration: `${Math.max(introVeilFadeMs, 0)}ms`,
              background:
                "linear-gradient(to bottom, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.82) 28%, rgba(0,0,0,0.72) 58%, rgba(0,0,0,0.94) 100%)",
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
