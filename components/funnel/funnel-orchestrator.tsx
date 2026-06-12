"use client"

import { useCallback, useRef, useState } from "react"
import type { PatternKey, Stage } from "./types"
import { trackFunnelEvent } from "./lib/analytics"
import { FunnelLanding } from "./funnel-landing"
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
  const [stage, setStage] = useState<Stage>("landing")
  const [pattern, setPattern] = useState<PatternKey>("A")
  const [opEntry, setOpEntry] = useState<OpEntry>("buy")
  const audioRef = useRef<HTMLAudioElement>(null)

  const go = useCallback(
    (s: Stage) => {
      trackFunnelEvent("exp_completed", { from: stage, to: s })
      setStage(s)
      window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior })
    },
    [stage],
  )

  const startExperience = useCallback(() => {
    trackFunnelEvent("funnel_started", { entry: "landing" })
    const audio = audioRef.current
    if (audio) {
      audio.volume = 0.85
      audio.currentTime = 0
      void audio.play().catch(() => {})
    }
    go("video")
  }, [go])

  return (
    <main className="relative min-h-screen w-full overflow-x-hidden bg-mystic text-foreground">
      {/* Persistent audio — lives across every stage so sound never cuts */}
      <audio ref={audioRef} src="/audio/intro-rings.mp3" preload="auto" playsInline />

      {stage === "landing" && <FunnelLanding onStart={startExperience} />}
      {stage === "video" && <Exp1Video onComplete={() => go("call")} />}
      {stage === "call" && <Exp2Call onComplete={() => go("scanner")} />}
      {stage === "scanner" && <Exp3Scanner onComplete={() => go("quiz")} />}
      {stage === "quiz" && (
        <Exp4Quiz
          onComplete={(p) => {
            setPattern(p)
            trackFunnelEvent("pattern_revealed", { pattern: p })
            go("reading")
          }}
        />
      )}
      {stage === "reading" && (
        <Exp5Reading pattern={pattern} onComplete={() => go("portal")} />
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
