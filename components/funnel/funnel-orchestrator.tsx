"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import type { PatternKey, Stage } from "./types"
import { trackFunnelEvent } from "./lib/analytics"
import { getInitialSceneFromUrl, getPatternFromUrl } from "./lib/deep-link"
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
import { Exp11WhatsappOp, type OpEntry } from "./exp11-whatsapp-op"

const QUIZ_LOOP_VOLUME = 0.4
const RESULT_LOOP_VOLUME = 0.15

const QUIZ_PRIMARY_AUDIO_SOURCES = [
  "/audio/quiz-p1-final.mp3",
  "/audio/quiz-p2-final.mp3",
  "/audio/quiz-p3-final.mp3",
  "/audio/quiz-p4-final.mp3",
  "/audio/quiz-p5-final.mp3",
] as const

const QUIZ_PRIMARY_AUDIO_BY_ANSWERED_QUESTION_INDEX: Partial<
  Record<number, string>
> = {
  0: "/audio/quiz-p2-final.mp3",
  1: "/audio/quiz-p3-final.mp3",
  2: "/audio/quiz-p4-final.mp3",
  3: "/audio/quiz-p5-final.mp3",
}

export function FunnelOrchestrator() {
  const [stage, setStage] = useState<Stage>("video")
  const [pattern, setPattern] = useState<PatternKey>("A")
  const [revealVideoStartToken, setRevealVideoStartToken] = useState(0)
  const [opEntry, setOpEntry] = useState<OpEntry>("buy")
  const introAudioRef = useRef<HTMLAudioElement>(null)
  const introAudioStarted = useRef(false)
  const quizLoopAudioRef = useRef<HTMLAudioElement | null>(null)
  const resultLoopAudioRef = useRef<HTMLAudioElement | null>(null)
  const quizPrimaryFallbackAudioRef = useRef<HTMLAudioElement | null>(null)
  const quizAudioContextRef = useRef<AudioContext | null>(null)
  const quizAudioBuffersRef = useRef<Map<string, AudioBuffer>>(new Map())
  const quizAudioPreloadPromiseRef = useRef<Promise<void> | null>(null)
  const quizPrimarySourceRef = useRef<AudioBufferSourceNode | null>(null)
  const quizPrimaryGainRef = useRef<GainNode | null>(null)

  useEffect(() => {
    const initialStage = getInitialSceneFromUrl()
    if (!initialStage) return

    // Query deep links are for internal scene review without a visible QA panel.
    if (initialStage === "reading") {
      setPattern(getPatternFromUrl() ?? "A")
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

    audio.pause()
    audio.currentTime = 0
  }, [])

  const startResultLoop = useCallback(() => {
    const audio = resultLoopAudioRef.current
    if (!audio) return

    try {
      audio.loop = true
      audio.volume = RESULT_LOOP_VOLUME

      if (!audio.paused) return

      audio.currentTime = 0
      void audio.play().catch(() => {
        // Best-effort only: browser autoplay policies must never block the flow.
      })
    } catch {
      // Best-effort only: audio failures must never block the flow.
    }
  }, [])

  const stopResultLoop = useCallback(() => {
    const audio = resultLoopAudioRef.current
    if (!audio) return

    try {
      audio.pause()
      audio.currentTime = 0
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

  useEffect(() => {
    if (stage === "quiz") return

    stopQuizAudio()
  }, [stage, stopQuizAudio])

  useEffect(() => {
    if (stage === "vsl") {
      stopResultLoop()
    }
  }, [stage, stopResultLoop])

  useEffect(() => {
    void preloadQuizPrimaryAudio()
  }, [preloadQuizPrimaryAudio])

  useEffect(() => {
    return () => {
      stopQuizAudio()
      stopResultLoop()
    }
  }, [stopQuizAudio, stopResultLoop])

  const handleRevealVeyraMessage = useCallback(
    (p: PatternKey) => {
      setPattern(p)
      stopQuizAudio()
      startResultLoop()
      trackFunnelEvent("pattern_revealed", { pattern: p })
      setRevealVideoStartToken((token) => token + 1)
      go("reading")
    },
    [go, startResultLoop, stopQuizAudio],
  )

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-mystic text-foreground">
      <audio ref={introAudioRef} src="/audio/intro-rings.mp3" preload="auto" />
      <audio
        ref={quizLoopAudioRef}
        src="/audio/loop-quiz.mp3"
        preload="auto"
        loop
      />
      <audio
        ref={resultLoopAudioRef}
        src="/audio/loop-result.mp3"
        preload="auto"
        loop
      />
      <audio
        ref={quizPrimaryFallbackAudioRef}
        preload="auto"
      />
      {stage === "video" && (
        <Exp1Video
          onStart={startExperience}
          onComplete={() => go("call")}
          startIntroAudio={startIntroAudio}
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
            void playQuizPrimaryAudio("/audio/quiz-p1-final.mp3")
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
            setPattern(p)
            stopQuizAudio()
          }}
          onComplete={handleRevealVeyraMessage}
        />
      )}
      {stage === "reading" && (
        <Exp5Reading
          pattern={pattern}
          startToken={revealVideoStartToken}
          onEnter={stopQuizAudio}
          onComplete={() => {
            stopQuizAudio()
            stopResultLoop()
            go("vsl")
          }}
        />
      )}
      {stage === "portal" && <Exp6Portal onComplete={() => go("vsl")} />}
      {stage === "vsl" && <VslInterlude onComplete={() => go("whatsapp-hook")} />}
      {stage === "whatsapp-hook" && (
        <Exp7WhatsappHook onComplete={() => go("login")} />
      )}
      {stage === "login" && <Exp8Login onComplete={() => go("feed")} />}
      {stage === "feed" && <Exp9Feed onComplete={() => go("offer")} />}
      {stage === "offer" && (
        <Exp10Offer
          onPrimary={() => {
            trackFunnelEvent("offer_cta_clicked", { intent: "buy" })
            setOpEntry("buy")
            go("whatsapp-op")
          }}
          onSecondary={() => {
            trackFunnelEvent("offer_cta_clicked", { intent: "doubt" })
            setOpEntry("doubt")
            go("whatsapp-op")
          }}
        />
      )}
      {stage === "whatsapp-op" && <Exp11WhatsappOp entry={opEntry} />}
    </main>
  )
}
