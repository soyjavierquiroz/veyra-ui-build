"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { CheckCircle2, LoaderCircle, Sparkles } from "lucide-react"
import type { PatternKey, Stage } from "./types"
import { PATTERNS } from "./types"
import { funnelRoute, publicAssetPath } from "./asset-version"
import {
  getOrCreateFunnelSid,
  goToOffer,
  persistFunnelContext,
  persistFunnelPattern,
  resolveFunnelPattern,
} from "./funnel-handoff"
import { funnelConfig, resultMp4VideosByPattern } from "./config"
import { trackFunnelEvent } from "./lib/analytics"
import { getInitialSceneFromUrl, getPatternFromUrl } from "./lib/deep-link"
import {
  initFunnelMetaPixel,
  trackFunnelCustomEvent,
} from "./lib/meta-pixel"
import { Exp1Video } from "./exp1-video"
import { Exp2Call } from "./exp2-call"
import { Exp3Scanner } from "./exp3-scanner"
import { Exp4Quiz } from "./exp4-quiz"
import { Exp5Reading } from "./exp5-reading"
import { Exp6Portal } from "./exp6-portal"
import { VslInterlude } from "./vsl-interlude"
import { Exp7WhatsappHook } from "./exp7-whatsapp-hook"
import { Exp8Login } from "./exp8-login"
import { Exp9Feed } from "./exp9-feed"
import { Exp10Offer } from "./exp10-offer"
import { Exp11WhatsappOp } from "./exp11-whatsapp-op"
import {
  ResultMp4Player,
  type ResultMp4PlayerHandle,
} from "./video-player/result-mp4-player"

const QUIZ_LOOP_VOLUME = 0.4
const RESULT_LOOP_VOLUME = 0.18
const RESULT_LOOP_FADE_IN_MS = 800
const QUIZ_LOOP_FADE_OUT_MS = 800
const QUIZ_PRIMARY_FADE_OUT_MS = 600
const INTRO_AUDIO_SRC = publicAssetPath("audio", "intro-rings.mp3")
const QUIZ_LOOP_AUDIO_SRC = publicAssetPath("audio", "loop-quiz.mp3")
const RESULT_LOOP_AUDIO_SRC = publicAssetPath("audio", "loop-result.mp3")
const QUIZ_P1_AUDIO_SRC = publicAssetPath("audio", "quiz-p1-final.mp3")

const QUIZ_PRIMARY_AUDIO_SOURCES = [
  QUIZ_P1_AUDIO_SRC,
  publicAssetPath("audio", "quiz-p2-final.mp3"),
  publicAssetPath("audio", "quiz-p3-final.mp3"),
  publicAssetPath("audio", "quiz-p4-final.mp3"),
  publicAssetPath("audio", "quiz-p5-final.mp3"),
  publicAssetPath("audio", "quiz-p6-final.mp3"),
] as const

const QUIZ_PRIMARY_AUDIO_BY_ANSWERED_QUESTION_INDEX: Partial<
  Record<number, string>
> = {
  0: QUIZ_PRIMARY_AUDIO_SOURCES[1],
  1: QUIZ_PRIMARY_AUDIO_SOURCES[2],
  2: QUIZ_PRIMARY_AUDIO_SOURCES[3],
  3: QUIZ_PRIMARY_AUDIO_SOURCES[4],
  4: QUIZ_PRIMARY_AUDIO_SOURCES[5],
}

function getResultMp4Src(pattern: PatternKey) {
  return resultMp4VideosByPattern[pattern]
}

function getPatternLabel(pattern: PatternKey) {
  return PATTERNS[pattern]?.label ?? ""
}

function fadeAudioElement(
  audio: HTMLAudioElement,
  targetVolume: number,
  durationMs: number,
  onComplete?: () => void,
) {
  const startVolume = audio.volume
  const startedAt = performance.now()
  let frameId: number | null = null
  let cancelled = false

  const step = (now: number) => {
    if (cancelled) return

    const progress =
      durationMs <= 0 ? 1 : Math.min((now - startedAt) / durationMs, 1)
    audio.volume = startVolume + (targetVolume - startVolume) * progress

    if (progress >= 1) {
      onComplete?.()
      return
    }

    frameId = window.requestAnimationFrame(step)
  }

  frameId = window.requestAnimationFrame(step)

  return () => {
    cancelled = true
    if (frameId !== null) {
      window.cancelAnimationFrame(frameId)
    }
  }
}

export function FunnelOrchestrator() {
  const [stage, setStage] = useState<Stage>("video")
  const [pattern, setPattern] = useState<PatternKey>("A")
  const [hasResolvedPattern, setHasResolvedPattern] = useState(false)
  const [isSceneReview, setIsSceneReview] = useState(false)
  const [preparedResultVideoSrc, setPreparedResultVideoSrc] = useState<
    string | null
  >(null)
  const [resultPlayerReadyToReveal, setResultPlayerReadyToReveal] =
    useState(false)
  const [resultRevealRequested, setResultRevealRequested] = useState(false)
  const [resultVideoPlaying, setResultVideoPlaying] = useState(false)
  const [showResultBridge, setShowResultBridge] = useState(false)
  const [isRevealingResult, setIsRevealingResult] = useState(false)
  const introAudioRef = useRef<HTMLAudioElement>(null)
  const introAudioStarted = useRef(false)
  const quizLoopAudioRef = useRef<HTMLAudioElement | null>(null)
  const resultLoopAudioRef = useRef<HTMLAudioElement | null>(null)
  const quizPrimaryFallbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const quizLoopFadeCancelRef = useRef<(() => void) | null>(null)
  const resultLoopFadeCancelRef = useRef<(() => void) | null>(null)
  const quizPrimaryStopTimeoutRef = useRef<number | null>(null)
  const resultRevealVeilFadeTimeoutRef = useRef<number | null>(null)
  const resultRevealVeilUnmountTimeoutRef = useRef<number | null>(null)
  const funnelStartTrackedRef = useRef(false)
  const resultViewedTrackedRef = useRef(false)
  const vslStartedTrackedRef = useRef(false)
  const vslCompletedTrackedRef = useRef(false)
  const quizAudioContextRef = useRef<AudioContext | null>(null)
  const quizAudioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map())
  const quizAudioPreloadPromiseRef = useRef<Promise<void> | null>(null)
  const quizPrimarySourceRef = useRef<AudioBufferSourceNode | null>(null)
  const quizPrimaryGainRef = useRef<GainNode | null>(null)
  const resultPlayerRef = useRef<ResultMp4PlayerHandle | null>(null)
  const resultRevealClickLockedRef = useRef(false)
  const resultFallbackTimerRef = useRef<number | null>(null)
  const [resultRevealVeilMounted, setResultRevealVeilMounted] = useState(false)
  const [resultRevealVeilVisible, setResultRevealVeilVisible] = useState(false)

  useEffect(() => {
    const initialStage = getInitialSceneFromUrl()
    const initialPattern = getPatternFromUrl()
    const sid = getOrCreateFunnelSid()

    initFunnelMetaPixel()
    persistFunnelContext({ sid, pattern: "" })

    if (!funnelStartTrackedRef.current) {
      funnelStartTrackedRef.current = true
      trackFunnelCustomEvent("FunnelStart", { sid })
    }

    if (initialPattern) {
      setPattern(initialPattern)
      setHasResolvedPattern(true)
      persistFunnelPattern(getPatternLabel(initialPattern))
      persistFunnelContext({
        sid,
        pattern: getPatternLabel(initialPattern),
      })
    }

    if (!initialStage) return

    setIsSceneReview(true)

    // Query deep links are for internal scene review without a visible QA panel.
    if (initialStage === "reading") {
      const readingPattern = initialPattern ?? "A"
      const initialResultSrc = getResultMp4Src(readingPattern)
      setPattern(readingPattern)
      setHasResolvedPattern(Boolean(initialPattern))
      setPreparedResultVideoSrc(initialResultSrc)
      setResultPlayerReadyToReveal(false)
      setResultRevealRequested(false)
      setResultVideoPlaying(false)
      setShowResultBridge(false)
    }
    setStage(initialStage)
  }, [])

  const go = useCallback(
    (s: Stage) => {
      trackFunnelEvent("exp_completed", { from: stage, to: s })
      setStage(s)
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    },
    [stage],
  )

  const openWhatsappFlow = useCallback((mode: "buy" | "doubt") => {
    const query = mode === "doubt" ? "?modo=duda" : "?modo=compra"
    window.location.href = `${funnelRoute("whatsapp/")}${query}`
  }, [])

  const startExperience = useCallback(() => {
    trackFunnelEvent("funnel_started", { entry: "exp1_overlay" })
  }, [])

  const getQuizAudioContext = useCallback(() => {
    if (typeof window === "undefined") return null

    if (!quizAudioContextRef.current) {
      const AudioContextClass =
        window.AudioContext ??
        (window as Window &
          typeof globalThis & {
            webkitAudioContext?: typeof AudioContext
          }).webkitAudioContext

      if (!AudioContextClass) return null

      quizAudioContextRef.current = new AudioContextClass()
    }

    return quizAudioContextRef.current
  }, [])

  const preloadQuizPrimaryAudio = useCallback(() => {
    if (quizAudioPreloadPromiseRef.current) {
      return quizAudioPreloadPromiseRef.current
    }

    quizAudioPreloadPromiseRef.current = (async () => {
      const audioContext = getQuizAudioContext()
      if (!audioContext) return

      await Promise.all(
        QUIZ_PRIMARY_AUDIO_SOURCES.map(async (src) => {
          if (quizAudioBuffersRef.current.has(src)) return

          try {
            const response = await fetch(src, { cache: "force-cache" })
            if (!response.ok) return

            const arrayBuffer = await response.arrayBuffer()
            const decoded = await audioContext.decodeAudioData(arrayBuffer)
            quizAudioBuffersRef.current.set(src, decoded)
          } catch {
            // Best-effort only: fallback HTMLAudio covers decode/fetch failures.
          }
        }),
      )
    })()

    return quizAudioPreloadPromiseRef.current
  }, [getQuizAudioContext])

  const resumeQuizAudioContext = useCallback(async () => {
    const audioContext = getQuizAudioContext()
    if (!audioContext) return

    try {
      if (audioContext.state === "suspended") {
        await audioContext.resume()
      }
    } catch {
      // Best-effort only: audio context failures must never block the flow.
    }
  }, [getQuizAudioContext])

  const startIntroAudio = useCallback(() => {
    const audio = introAudioRef.current
    if (!audio) return

    try {
      if (!introAudioStarted.current) {
        audio.currentTime = 0
        introAudioStarted.current = true
      }
      audio.volume = 1
      void audio.play().catch((error: unknown) => {
        if (process.env.NODE_ENV !== "production") {
          console.warn("[funnel] intro audio playback failed", error)
        }
      })
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[funnel] intro audio playback failed", error)
      }
    }
  }, [])

  const stopIntroAudio = useCallback(() => {
    const audio = introAudioRef.current
    if (!audio) return

    try {
      audio.pause()
      audio.currentTime = 0
    } catch (error) {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[funnel] intro audio stop failed", error)
      }
    }
    introAudioStarted.current = false
  }, [])

  const startQuizLoop = useCallback(() => {
    const audio = quizLoopAudioRef.current
    if (!audio) return

    quizLoopFadeCancelRef.current?.()
    quizLoopFadeCancelRef.current = null
    audio.volume = QUIZ_LOOP_VOLUME
    audio.loop = true

    if (!audio.paused) return

    audio.currentTime = 0
    void audio.play().catch(() => {
      // Best-effort only: browser autoplay policies must never block the flow.
    })
  }, [])

  const stopQuizLoop = useCallback(() => {
    const audio = quizLoopAudioRef.current
    if (!audio) return

    quizLoopFadeCancelRef.current?.()
    quizLoopFadeCancelRef.current = null
    audio.pause()
    audio.currentTime = 0
  }, [])

  const startResultLoop = useCallback(() => {
    const audio = resultLoopAudioRef.current
    if (!audio) return

    try {
      audio.loop = true
      resultLoopFadeCancelRef.current?.()
      resultLoopFadeCancelRef.current = null

      if (!audio.paused) return

      audio.currentTime = 0
      audio.volume = 0
      void audio.play().catch(() => {
        // Best-effort only: browser autoplay policies must never block the flow.
      })
      resultLoopFadeCancelRef.current = fadeAudioElement(
        audio,
        RESULT_LOOP_VOLUME,
        RESULT_LOOP_FADE_IN_MS,
        () => {
          resultLoopFadeCancelRef.current = null
        },
      )
    } catch {
      // Best-effort only: audio failures must never block the flow.
    }
  }, [])

  const stopResultLoop = useCallback(() => {
    const audio = resultLoopAudioRef.current
    if (!audio) return

    try {
      resultLoopFadeCancelRef.current?.()
      resultLoopFadeCancelRef.current = null
      audio.pause()
      audio.currentTime = 0
      audio.volume = RESULT_LOOP_VOLUME
    } catch {
      // Best-effort only: audio failures must never block the flow.
    }
  }, [])

  const stopQuizPrimaryFallbackAudio = useCallback(() => {
    const audio = quizPrimaryFallbackAudioRef.current
    if (!audio) return

    try {
      audio.pause()
      audio.currentTime = 0
    } catch {
      // Best-effort only: audio failures must never block the flow.
    }
  }, [])

  const playQuizPrimaryFallbackAudio = useCallback((src: string) => {
    const audio = quizPrimaryFallbackAudioRef.current
    if (!audio) return

    try {
      audio.pause()
      if (audio.getAttribute("src") !== src) {
        audio.src = src
      }
      audio.currentTime = 0
      audio.volume = 1
      audio.loop = false
      void audio.play().catch(() => {
        // Best-effort only: browser autoplay policies must never block the flow.
      })
    } catch {
      // Best-effort only: audio failures must never block the flow.
    }
  }, [])

  const stopQuizPrimaryAudio = useCallback(() => {
    if (quizPrimaryStopTimeoutRef.current !== null) {
      window.clearTimeout(quizPrimaryStopTimeoutRef.current)
      quizPrimaryStopTimeoutRef.current = null
    }

    try {
      quizPrimarySourceRef.current?.stop()
    } catch {
      // Source may already be stopped.
    }

    try {
      quizPrimarySourceRef.current?.disconnect()
    } catch {
      // Best-effort cleanup.
    }

    quizPrimarySourceRef.current = null

    try {
      quizPrimaryGainRef.current?.disconnect()
    } catch {
      // Best-effort cleanup.
    }

    quizPrimaryGainRef.current = null
    stopQuizPrimaryFallbackAudio()
  }, [stopQuizPrimaryFallbackAudio])

  const playQuizPrimaryAudio = useCallback(
    async (src: string) => {
      stopQuizPrimaryAudio()

      const audioContext = getQuizAudioContext()
      if (!audioContext) {
        playQuizPrimaryFallbackAudio(src)
        return
      }

      try {
        if (audioContext.state === "suspended") {
          await audioContext.resume()
        }

        let buffer = quizAudioBuffersRef.current.get(src)

        if (!buffer) {
          try {
            await preloadQuizPrimaryAudio()
          } catch {
            // Fallback below if preload cannot finish.
          }

          buffer = quizAudioBuffersRef.current.get(src)
        }

        if (!buffer) {
          playQuizPrimaryFallbackAudio(src)
          return
        }

        const source = audioContext.createBufferSource()
        const gain = audioContext.createGain()

        source.buffer = buffer
        source.loop = false
        gain.gain.value = 1

        source.connect(gain)
        gain.connect(audioContext.destination)

        quizPrimarySourceRef.current = source
        quizPrimaryGainRef.current = gain

        source.onended = () => {
          if (quizPrimarySourceRef.current === source) {
            quizPrimarySourceRef.current = null
          }

          if (quizPrimaryGainRef.current === gain) {
            quizPrimaryGainRef.current = null
          }

          try {
            source.disconnect()
          } catch {
            // Best-effort cleanup.
          }

          try {
            gain.disconnect()
          } catch {
            // Best-effort cleanup.
          }
        }

        source.start(0)
      } catch {
        playQuizPrimaryFallbackAudio(src)
      }
    },
    [
      getQuizAudioContext,
      playQuizPrimaryFallbackAudio,
      preloadQuizPrimaryAudio,
      stopQuizPrimaryAudio,
    ],
  )

  const stopQuizAudio = useCallback(() => {
    stopQuizLoop()
    stopQuizPrimaryAudio()
  }, [stopQuizLoop, stopQuizPrimaryAudio])

  const startFastExperience = useCallback(() => {
    startExperience()
    void resumeQuizAudioContext()
    startQuizLoop()
    void playQuizPrimaryAudio(QUIZ_P1_AUDIO_SRC)
    go("quiz")
  }, [
    go,
    playQuizPrimaryAudio,
    resumeQuizAudioContext,
    startExperience,
    startQuizLoop,
  ])

  const fadeOutQuizAudio = useCallback(() => {
    const quizLoopAudio = quizLoopAudioRef.current

    if (quizLoopAudio && !quizLoopAudio.paused) {
      quizLoopFadeCancelRef.current?.()
      quizLoopFadeCancelRef.current = fadeAudioElement(
        quizLoopAudio,
        0,
        QUIZ_LOOP_FADE_OUT_MS,
        () => {
          quizLoopAudio.pause()
          quizLoopAudio.currentTime = 0
          quizLoopAudio.volume = QUIZ_LOOP_VOLUME
          quizLoopFadeCancelRef.current = null
        },
      )
    }

    const fallbackAudio = quizPrimaryFallbackAudioRef.current

    if (fallbackAudio && !fallbackAudio.paused) {
      fadeAudioElement(fallbackAudio, 0, QUIZ_PRIMARY_FADE_OUT_MS, () => {
        fallbackAudio.pause()
        fallbackAudio.currentTime = 0
        fallbackAudio.volume = 1
      })
    }

    const audioContext = quizAudioContextRef.current
    const gain = quizPrimaryGainRef.current

    if (audioContext && gain) {
      const now = audioContext.currentTime

      try {
        gain.gain.cancelScheduledValues(now)
        gain.gain.setValueAtTime(gain.gain.value, now)
        gain.gain.linearRampToValueAtTime(
          0,
          now + QUIZ_PRIMARY_FADE_OUT_MS / 1000,
        )
      } catch {
        // If the scheduled fade cannot be applied, the timeout below still stops it.
      }

      if (quizPrimaryStopTimeoutRef.current !== null) {
        window.clearTimeout(quizPrimaryStopTimeoutRef.current)
      }

      quizPrimaryStopTimeoutRef.current = window.setTimeout(() => {
        quizPrimaryStopTimeoutRef.current = null
        stopQuizPrimaryAudio()
      }, QUIZ_PRIMARY_FADE_OUT_MS)
    }
  }, [stopQuizPrimaryAudio])

  const clearResultFallbackTimer = useCallback(() => {
    if (resultFallbackTimerRef.current === null) return

    window.clearTimeout(resultFallbackTimerRef.current)
    resultFallbackTimerRef.current = null
  }, [])

  const clearResultRevealVeilTimers = useCallback(() => {
    if (resultRevealVeilFadeTimeoutRef.current !== null) {
      window.clearTimeout(resultRevealVeilFadeTimeoutRef.current)
      resultRevealVeilFadeTimeoutRef.current = null
    }

    if (resultRevealVeilUnmountTimeoutRef.current !== null) {
      window.clearTimeout(resultRevealVeilUnmountTimeoutRef.current)
      resultRevealVeilUnmountTimeoutRef.current = null
    }
  }, [])

  const showResultRevealVeil = useCallback(() => {
    clearResultRevealVeilTimers()
    setResultRevealVeilMounted(true)
    setResultRevealVeilVisible(true)
  }, [clearResultRevealVeilTimers])

  const hideResultRevealVeil = useCallback(() => {
    clearResultRevealVeilTimers()
    setResultRevealVeilVisible(false)
    setResultRevealVeilMounted(false)
  }, [clearResultRevealVeilTimers])

  const dismissResultRevealVeil = useCallback(() => {
    clearResultRevealVeilTimers()

    const safeDuration = Math.max(
      funnelConfig.resultIntroVeilDurationMs,
      0,
    )
    const safeFade = Math.max(funnelConfig.resultIntroVeilFadeMs, 0)
    const visibleDuration = Math.max(safeDuration - safeFade, 0)

    setResultRevealVeilMounted(true)
    setResultRevealVeilVisible(true)

    resultRevealVeilFadeTimeoutRef.current = window.setTimeout(() => {
      setResultRevealVeilVisible(false)
    }, visibleDuration)

    resultRevealVeilUnmountTimeoutRef.current = window.setTimeout(() => {
      setResultRevealVeilMounted(false)
    }, safeDuration)
  }, [clearResultRevealVeilTimers])

  const startResultFallbackTimer = useCallback(() => {
    clearResultFallbackTimer()
    resultFallbackTimerRef.current = window.setTimeout(() => {
      resultFallbackTimerRef.current = null
      setShowResultBridge(true)
    }, funnelConfig.resultVideoFallbackDurationSeconds * 1000)
  }, [clearResultFallbackTimer])

  const handleResultVideoEnded = useCallback(() => {
    clearResultFallbackTimer()
    hideResultRevealVeil()
    setResultRevealRequested(false)
    setResultVideoPlaying(false)
    setShowResultBridge(true)
  }, [clearResultFallbackTimer, hideResultRevealVeil])

  useEffect(() => {
    if (stage === "quiz" || stage === "reading") return

    stopQuizAudio()
  }, [stage, stopQuizAudio])

  useEffect(() => {
    if (stage === "vsl") {
      stopResultLoop()
    }
  }, [stage, stopResultLoop])

  useEffect(() => {
    if (stage === "reading") {
      if (showResultBridge) {
        hideResultRevealVeil()
        return
      }

      showResultRevealVeil()
      return
    }

    clearResultFallbackTimer()
    hideResultRevealVeil()
    setShowResultBridge(false)
    setResultRevealRequested(false)
    setResultVideoPlaying(false)
    setResultPlayerReadyToReveal(false)
    setIsRevealingResult(false)
    resultRevealClickLockedRef.current = false
  }, [
    clearResultFallbackTimer,
    hideResultRevealVeil,
    showResultBridge,
    showResultRevealVeil,
    stage,
  ])

  useEffect(() => {
    void preloadQuizPrimaryAudio()
  }, [preloadQuizPrimaryAudio])

  useEffect(() => {
    if (!preparedResultVideoSrc) return

    const selector = `link[rel="preload"][as="video"][href="${preparedResultVideoSrc}"]`
    let link = document.head.querySelector<HTMLLinkElement>(selector)

    if (!link) {
      link = document.createElement("link")
      link.rel = "preload"
      link.as = "video"
      link.href = preparedResultVideoSrc
      document.head.appendChild(link)
    }

    resultPlayerRef.current?.preload()
  }, [preparedResultVideoSrc])

  useEffect(() => {
    if (!preparedResultVideoSrc || resultPlayerReadyToReveal) return

    const timer = window.setTimeout(() => {
      resultPlayerRef.current?.preload()
    }, funnelConfig.resultVideoReadyTimeoutMs)

    return () => window.clearTimeout(timer)
  }, [preparedResultVideoSrc, resultPlayerReadyToReveal])

  useEffect(() => {
    return () => {
      clearResultFallbackTimer()
      clearResultRevealVeilTimers()
      resultPlayerRef.current?.stop()
      quizLoopFadeCancelRef.current?.()
      resultLoopFadeCancelRef.current?.()
      if (quizPrimaryStopTimeoutRef.current !== null) {
        window.clearTimeout(quizPrimaryStopTimeoutRef.current)
      }
      stopQuizAudio()
      stopResultLoop()
    }
  }, [
    clearResultFallbackTimer,
    clearResultRevealVeilTimers,
    stopQuizAudio,
    stopResultLoop,
  ])

  const handlePatternReadyForReading = useCallback(
    (p: PatternKey) => {
      const resultVideoSrc = getResultMp4Src(p)
      setPattern(p)
      setHasResolvedPattern(true)
      setPreparedResultVideoSrc(resultVideoSrc)
      setResultPlayerReadyToReveal(false)
      setResultRevealRequested(false)
      setResultVideoPlaying(false)
      setShowResultBridge(false)
      showResultRevealVeil()
      resultPlayerRef.current?.preload()
      persistFunnelPattern(getPatternLabel(p))
      persistFunnelContext({ pattern: getPatternLabel(p) })
      trackFunnelEvent("pattern_revealed", { pattern: p })
      if (!resultViewedTrackedRef.current) {
        resultViewedTrackedRef.current = true
        trackFunnelCustomEvent("ResultViewed", {
          sid: getOrCreateFunnelSid(),
          pattern: getPatternLabel(p),
        })
      }
      go("reading")
    },
    [go, showResultRevealVeil],
  )

  const getHandoffPattern = useCallback(() => {
    if (!hasResolvedPattern) return resolveFunnelPattern()

    return getPatternLabel(pattern)
  }, [hasResolvedPattern, pattern])

  const handleVslComplete = useCallback(() => {
    const sid = getOrCreateFunnelSid()
    const handoffPattern = getHandoffPattern()

    persistFunnelContext({
      sid,
      pattern: handoffPattern,
      vslStarted: true,
      vslCompleted: true,
    })

    if (!vslCompletedTrackedRef.current) {
      vslCompletedTrackedRef.current = true
      trackFunnelCustomEvent("VSLCompleted", {
        sid,
        pattern: handoffPattern,
      })
    }

    goToOffer({
      sid,
      pattern: handoffPattern,
      vslCompleted: true,
    })
  }, [getHandoffPattern])

  const handleVslStarted = useCallback(() => {
    if (vslStartedTrackedRef.current) return

    vslStartedTrackedRef.current = true
    const sid = getOrCreateFunnelSid()
    const handoffPattern = getHandoffPattern()

    persistFunnelContext({
      sid,
      pattern: handoffPattern,
      vslStarted: true,
    })
    trackFunnelCustomEvent("VSLStarted", {
      sid,
      pattern: handoffPattern,
    })
  }, [getHandoffPattern])

  const handleRevealPreparedResult = useCallback(async () => {
    if (resultRevealClickLockedRef.current) return
    resultRevealClickLockedRef.current = true
    setIsRevealingResult(true)

    const player = resultPlayerRef.current
    if (!player?.isReady()) {
      resultRevealClickLockedRef.current = false
      setIsRevealingResult(false)
      return
    }

    try {
      await player.playWithSound()
    } catch {
      resultRevealClickLockedRef.current = false
      setIsRevealingResult(false)
      return
    }

    fadeOutQuizAudio()
    setResultRevealRequested(true)
    setResultVideoPlaying(false)
    setIsRevealingResult(false)
    setShowResultBridge(false)
    dismissResultRevealVeil()
    startResultFallbackTimer()
    startResultLoop()
  }, [
    dismissResultRevealVeil,
    fadeOutQuizAudio,
    startResultFallbackTimer,
    startResultLoop,
  ])

  const handleResultPlaybackFailed = useCallback(() => {
    clearResultFallbackTimer()
    setResultRevealRequested(false)
    setResultVideoPlaying(false)
    setIsRevealingResult(false)
    resultRevealClickLockedRef.current = false
    showResultRevealVeil()
    setResultPlayerReadyToReveal(resultPlayerRef.current?.isReady() ?? false)
  }, [clearResultFallbackTimer, showResultRevealVeil])

  const showRevealResultButton =
    stage === "reading" &&
    resultPlayerReadyToReveal &&
    !resultRevealRequested &&
    !resultVideoPlaying &&
    !showResultBridge

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-mystic text-foreground">
      <audio ref={introAudioRef} src={INTRO_AUDIO_SRC} preload="auto" />
      <audio
        ref={quizLoopAudioRef}
        src={QUIZ_LOOP_AUDIO_SRC}
        preload="auto"
        loop
      />
      <audio
        ref={resultLoopAudioRef}
        src={RESULT_LOOP_AUDIO_SRC}
        preload="auto"
        loop
      />
      <audio
        ref={quizPrimaryFallbackAudioRef}
        preload="auto"
      />
      {preparedResultVideoSrc && stage !== "vsl" && (
        <ResultMp4Player
          ref={resultPlayerRef}
          src={preparedResultVideoSrc}
          visible={stage === "reading"}
          autoPreload
          objectFit={funnelConfig.resultVideoObjectFit}
          revealRequested={resultRevealRequested}
          introVeilActive={resultRevealVeilMounted}
          introVeilDurationMs={funnelConfig.resultIntroVeilDurationMs}
          introVeilFadeMs={funnelConfig.resultIntroVeilFadeMs}
          onReadyToReveal={() => {
            setResultPlayerReadyToReveal(true)
          }}
          onPlaying={() => {
            setResultVideoPlaying(true)
            setResultRevealRequested(true)
          }}
          onPlaybackFailed={handleResultPlaybackFailed}
          onEnded={handleResultVideoEnded}
        />
      )}
      {stage === "video" && (
        <Exp1Video
          onStart={isSceneReview ? startExperience : startFastExperience}
          onComplete={() => go("call")}
          startIntroAudio={startIntroAudio}
          skipIntroVideo={!isSceneReview}
        />
      )}
      {stage === "call" && (
        <Exp2Call
          onComplete={() => go("scanner")}
          stopIntroAudio={stopIntroAudio}
        />
      )}
      {stage === "scanner" && (
        <Exp3Scanner
          onComplete={() => {
            void resumeQuizAudioContext()
            startQuizLoop()
            void playQuizPrimaryAudio(QUIZ_P1_AUDIO_SRC)
            go("quiz")
          }}
        />
      )}
      {stage === "quiz" && (
        <Exp4Quiz
          onAnswerSelected={(questionIndex) => {
            const nextAudioSrc =
              QUIZ_PRIMARY_AUDIO_BY_ANSWERED_QUESTION_INDEX[questionIndex]

            if (nextAudioSrc) {
              void playQuizPrimaryAudio(nextAudioSrc)
              return
            }

            stopQuizAudio()
          }}
          onPatternReady={(p) => {
            const resultVideoSrc = getResultMp4Src(p)
            setPattern(p)
            setHasResolvedPattern(true)
            setPreparedResultVideoSrc(resultVideoSrc)
            setResultPlayerReadyToReveal(false)
            setResultRevealRequested(false)
            setResultVideoPlaying(false)
            persistFunnelPattern(getPatternLabel(p))
            persistFunnelContext({ pattern: getPatternLabel(p) })
            resultPlayerRef.current?.preload()
          }}
          onComplete={handlePatternReadyForReading}
        />
      )}
      {stage === "reading" && (
        <Exp5Reading
          pattern={pattern}
          showBridge={showResultBridge}
          onComplete={() => {
            stopQuizAudio()
            stopResultLoop()
            clearResultFallbackTimer()
            resultPlayerRef.current?.reset()
            setPreparedResultVideoSrc(null)
            setResultPlayerReadyToReveal(false)
            setResultRevealRequested(false)
            setResultVideoPlaying(false)
            hideResultRevealVeil()
            setShowResultBridge(false)
            go("vsl")
          }}
        />
      )}
      {stage === "reading" && resultRevealVeilMounted && !showResultBridge && (
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 z-[60] transition-opacity ease-out ${
            resultRevealVeilVisible ? "opacity-100" : "opacity-0"
          }`}
          style={{
            opacity: resultRevealVeilVisible
              ? Math.min(
                  Math.max(funnelConfig.resultIntroVeilOpacity, 0),
                  1,
                )
              : 0,
            transitionDuration: `${Math.max(
              funnelConfig.resultIntroVeilFadeMs,
              0,
            )}ms`,
            background:
              "linear-gradient(to bottom, rgba(0,0,0,0.94) 0%, rgba(0,0,0,0.82) 28%, rgba(0,0,0,0.72) 58%, rgba(0,0,0,0.94) 100%)",
          }}
        />
      )}
      {showRevealResultButton && (
        <div className="pointer-events-none absolute inset-0 z-[70] flex justify-center overflow-hidden px-4">
          <div className="relative flex min-h-[100dvh] w-full max-w-[460px] items-end justify-center px-1 pb-[max(1.2rem,env(safe-area-inset-bottom))] pt-[max(2rem,env(safe-area-inset-top))] min-[390px]:px-3 min-[700px]:items-center min-[700px]:pb-0">
            <div className="pointer-events-none absolute inset-x-8 top-[12%] h-32 rounded-full bg-[radial-gradient(circle,oklch(0.82_0.12_86/.22),transparent_68%)] blur-2xl" />
            <div className="pointer-events-auto animate-float-up w-full max-w-[390px] rounded-[8px] border border-gold/35 bg-[linear-gradient(180deg,oklch(0.18_0.07_300/.84),oklch(0.07_0.03_292/.92))] px-4 py-5 text-center shadow-[0_0_34px_oklch(0.82_0.12_86/.18),0_22px_70px_rgba(0,0,0,.58)] backdrop-blur-md min-[390px]:px-5 min-[390px]:py-6">
              <div className="mx-auto mb-3 flex size-12 items-center justify-center rounded-full border border-gold/45 bg-gold/10 text-gold shadow-[0_0_26px_oklch(0.82_0.12_86/.25)]">
                <CheckCircle2 className="size-6" aria-hidden="true" />
              </div>

              <p className="text-[0.64rem] font-semibold uppercase leading-none tracking-[0.28em] text-gold/90">
                LECTURA COMPLETADA
              </p>

              <div className="mx-auto my-4 flex w-full max-w-[250px] items-center gap-2">
                <span className="h-px flex-1 bg-gold/25" />
                <Sparkles className="size-3.5 text-gold/75" aria-hidden="true" />
                <span className="h-px flex-1 bg-gold/25" />
              </div>

              <h1 className="font-serif text-[1.72rem] leading-[1.04] text-gold text-balance drop-shadow-[0_0_18px_oklch(0.05_0.02_292/.9)] min-[390px]:text-[1.95rem]">
                Veyra ya identificó el patrón que se activó en ti.
              </h1>

              <p className="mx-auto mt-3 max-w-[330px] text-[0.94rem] leading-relaxed text-[#f5eedc]/88 text-balance min-[390px]:text-base">
                Ahora vas a descubrir por qué sentiste el impulso de volver al
                chat… y qué hay detrás de ese movimiento emocional.
              </p>

              <div className="mt-4 overflow-hidden rounded-full border border-gold/20 bg-black/30 p-1 shadow-[inset_0_0_14px_rgba(0,0,0,.45)]">
                <div className="h-1.5 rounded-full bg-[linear-gradient(90deg,oklch(0.66_0.19_304/.9),oklch(0.82_0.12_86/.95))] shadow-[0_0_18px_oklch(0.82_0.12_86/.35)]" />
              </div>

              <p className="mt-2 text-[0.62rem] font-medium uppercase tracking-[0.24em] text-[#f5eedc]/62">
                Patrón detectado
              </p>

              <button
                type="button"
                onClick={handleRevealPreparedResult}
                disabled={isRevealingResult}
                aria-busy={isRevealingResult}
                className="mt-4 flex min-h-12 w-full items-center justify-center gap-2 rounded-full border border-gold/70 bg-[linear-gradient(135deg,oklch(0.86_0.12_86/.98),oklch(0.66_0.15_72/.98))] px-4 py-3 text-center text-[0.8rem] font-bold uppercase leading-tight tracking-[0.16em] text-[oklch(0.12_0.04_292)] shadow-[0_0_24px_oklch(0.82_0.12_86/.34),inset_0_1px_0_rgba(255,255,255,.28)] transition-transform active:scale-95 disabled:cursor-wait disabled:opacity-90 min-[390px]:text-sm"
              >
                {isRevealingResult ? (
                  <>
                    <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    <span>Veyra está abriendo tu lectura...</span>
                  </>
                ) : (
                  "DESCUBRIR MI PATRÓN"
                )}
              </button>

              <p className="mt-3 font-serif text-[1.02rem] leading-snug text-[#f5eedc]/82 text-balance">
                Tu revelación ya está lista.
              </p>
            </div>
          </div>
        </div>
      )}
      {stage === "portal" && <Exp6Portal onComplete={() => go("vsl")} />}
      {stage === "vsl" && (
        <VslInterlude
          onStarted={handleVslStarted}
          onComplete={handleVslComplete}
        />
      )}
      {stage === "whatsapp-hook" && (
        <Exp7WhatsappHook onComplete={() => go("login")} />
      )}
      {stage === "login" && <Exp8Login onComplete={() => go("feed")} />}
      {stage === "feed" && <Exp9Feed onComplete={() => go("offer")} />}
      {stage === "offer" && (
        <Exp10Offer
          onPrimary={() => {
            trackFunnelEvent("offer_cta_clicked", { intent: "buy" })
            openWhatsappFlow("buy")
          }}
          onSecondary={() => {
            trackFunnelEvent("offer_cta_clicked", { intent: "doubt" })
            openWhatsappFlow("doubt")
          }}
        />
      )}
      {stage === "whatsapp-op" && <Exp11WhatsappOp entry="buy" />}
    </main>
  )
}
