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

export function FunnelOrchestrator() {
  const [stage, setStage] = useState<Stage>("video")
  const [pattern, setPattern] = useState<PatternKey>("A")
  const [opEntry, setOpEntry] = useState<OpEntry>("buy")
  const introAudioRef = useRef<HTMLAudioElement>(null)
  const introAudioStarted = useRef(false)
  const quizLoopAudioRef = useRef<HTMLAudioElement | null>(null)
  const quizPrimaryAudioRef = useRef<HTMLAudioElement | null>(null)

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

    audio.volume = 0.5
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

  const playQuizPrimaryAudio = useCallback((src: string) => {
    const audio = quizPrimaryAudioRef.current
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
    const audio = quizPrimaryAudioRef.current
    if (!audio) return

    try {
      audio.pause()
      audio.currentTime = 0
    } catch {
      // Best-effort only: audio failures must never block the flow.
    }
  }, [])

  useEffect(() => {
    if (stage === "quiz" || stage === "reading") return

    stopQuizLoop()
    stopQuizPrimaryAudio()
  }, [stage, stopQuizLoop, stopQuizPrimaryAudio])

  useEffect(() => {
    return () => {
      stopQuizLoop()
      stopQuizPrimaryAudio()
    }
  }, [stopQuizLoop, stopQuizPrimaryAudio])

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
        ref={quizPrimaryAudioRef}
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
            startQuizLoop()
            playQuizPrimaryAudio("/audio/quiz-p1-final.mp3")
            go("quiz")
          }}
        />
      )}
      {stage === "quiz" && (
        <Exp4Quiz
          onAnswerSelected={(questionIndex) => {
            if (questionIndex === 0) {
              playQuizPrimaryAudio("/audio/quiz-p2-final.mp3")
            }

            if (questionIndex === 1) {
              stopQuizPrimaryAudio()
            }
          }}
          onComplete={(p) => {
            setPattern(p)
            trackFunnelEvent("pattern_revealed", { pattern: p })
            go("reading")
          }}
        />
      )}
      {stage === "reading" && (
        <Exp5Reading
          pattern={pattern}
          onComplete={() => {
            stopQuizLoop()
            stopQuizPrimaryAudio()
            go("portal")
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
