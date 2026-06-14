"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { ArrowRight, Play } from "lucide-react"
import type { PatternKey } from "./types"
import { PATTERNS } from "./types"
import { Particles } from "./particles"

type ResultVideoConfig = {
  video: string
  shortText: string
  bridge: string
}

const RESULT_VIDEOS: Record<PatternKey, ResultVideoConfig> = {
  A: {
    video: "/videos/resp1-veyra-final.mp4",
    shortText:
      "No buscabas solo una respuesta.\nBuscabas una señal de que todavía existes para él.",
    bridge: "Veyra reveló el miedo.\nJanny puede ayudarte a no abandonarte tú.",
  },
  B: {
    video: "/videos/resp2-veyra-final.mp4",
    shortText:
      "No querías solo que respondiera.\nQuerías sentir que todavía importas.",
    bridge:
      "Veyra reveló la búsqueda.\nJanny puede ayudarte a recuperar tu centro.",
  },
  C: {
    video: "/videos/resp3-veyra-final.mp4",
    shortText:
      "Tu mente pide una explicación.\nPero tu emoción puede estar buscando volver a abrir la puerta.",
    bridge:
      "Veyra reveló la pregunta abierta.\nJanny puede ayudarte a ordenar lo que duele adentro.",
  },
  D: {
    video: "/videos/resp4-veyra-final.mp4",
    shortText: "Una parte de ti cree que cuidarte también puede lastimar.",
    bridge:
      "Veyra reveló la culpa.\nJanny puede ayudarte a elegirte sin castigarte.",
  },
  E: {
    video: "/videos/resp5-veyra-final.mp4",
    shortText:
      "No extrañas solo a esa persona.\nExtrañas cómo te sentías cuando parecía posible.",
    bridge:
      "Veyra reveló la nostalgia.\nJanny puede ayudarte a mirar la historia completa.",
  },
  F: {
    video: "/videos/resp6-veyra-final.mp4",
    shortText:
      "Tu impulso no buscaba una conversación.\nBuscaba apagar la angustia que aparece cuando él no responde.",
    bridge:
      "Veyra reveló la ansiedad.\nJanny puede ayudarte a sostener la pausa sin obedecer la urgencia.",
  },
}

const FALLBACK_BRIDGE_DELAY_MS = 2200

function resetVideo(video: HTMLVideoElement | null) {
  if (!video) return

  try {
    video.pause()
    video.currentTime = 0
  } catch {
    // Best-effort only: media cleanup must never block navigation.
  }
}

export function Exp5Reading({
  pattern,
  startToken,
  onEnter,
  onComplete,
}: {
  pattern: PatternKey
  startToken: number
  onEnter?: () => void
  onComplete: () => void
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const timersRef = useRef<number[]>([])
  const [showBridge, setShowBridge] = useState(false)
  const [playBlocked, setPlayBlocked] = useState(false)
  const [fallbackPending, setFallbackPending] = useState(false)

  const config = RESULT_VIDEOS[pattern] ?? RESULT_VIDEOS.A
  const info = PATTERNS[pattern] ?? PATTERNS.A

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((timer) => window.clearTimeout(timer))
    timersRef.current = []
  }, [])

  const scheduleBridgeFallback = useCallback(() => {
    setFallbackPending(true)
    const timer = window.setTimeout(() => {
      timersRef.current = timersRef.current.filter((id) => id !== timer)
      setFallbackPending(false)
      setShowBridge(true)
    }, FALLBACK_BRIDGE_DELAY_MS)

    timersRef.current.push(timer)
  }, [])

  const playVideo = useCallback(async () => {
    const video = videoRef.current
    if (!video) {
      setPlayBlocked(true)
      return false
    }

    try {
      video.muted = false
      video.currentTime = 0
      await video.play()
      setPlayBlocked(false)
      setFallbackPending(false)
      return true
    } catch {
      setPlayBlocked(true)
      return false
    }
  }, [])

  useEffect(() => {
    onEnter?.()
    clearTimers()
    setShowBridge(false)
    setPlayBlocked(false)
    setFallbackPending(false)

    const video = videoRef.current
    if (video) {
      video.muted = false
      video.load()
    }

    void playVideo()

    return () => {
      clearTimers()
      resetVideo(videoRef.current)
    }
  }, [clearTimers, config.video, onEnter, playVideo, startToken])

  const handleRecoveryClick = async () => {
    clearTimers()
    setPlayBlocked(false)
    const played = await playVideo()

    if (!played) {
      setPlayBlocked(false)
      scheduleBridgeFallback()
    }
  }

  const handleComplete = () => {
    clearTimers()
    resetVideo(videoRef.current)
    onComplete()
  }

  const handleVideoEnded = () => {
    setPlayBlocked(false)
    setFallbackPending(false)
    setShowBridge(true)
  }

  const handleVideoError = () => {
    setPlayBlocked(false)
    setFallbackPending(false)
    setShowBridge(true)
  }

  return (
    <section className="access-chamber relative flex min-h-screen flex-col overflow-hidden px-4 py-6 sm:px-5 sm:py-8">
      <Particles count={22} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,oklch(0.36_0.15_304/.34),transparent_30%),radial-gradient(circle_at_50%_78%,oklch(0.72_0.12_86/.10),transparent_34%),linear-gradient(180deg,oklch(0.06_0.03_292),oklch(0.12_0.07_300)_48%,oklch(0.05_0.02_292))]" />
      <div className="pointer-events-none absolute -top-24 left-1/2 size-[340px] -translate-x-1/2 rounded-full border border-gold/10 blur-[1px] access-portal" />

      <div className="relative z-10 mx-auto flex min-h-[calc(100vh-3rem)] w-full max-w-[460px] flex-col justify-center gap-4">
        <div className="text-center">
          <p className="text-[0.68rem] uppercase tracking-[0.3em] text-muted-foreground">
            Tu patrón dominante es:
          </p>
          <h1 className="mt-2 font-serif text-2xl leading-tight text-gold text-balance">
            {info.title}
          </h1>
        </div>

        <div className="relative min-h-[62vh] overflow-hidden rounded-2xl border border-gold/20 bg-black shadow-[0_0_34px_oklch(0.45_0.18_304/.24),inset_0_0_28px_oklch(0.82_0.12_86/.06)]">
          <video
            ref={videoRef}
            src={config.video}
            className={`h-full min-h-[62vh] w-full object-cover transition-opacity duration-700 ${
              showBridge ? "opacity-28" : "opacity-100"
            }`}
            playsInline
            controls={false}
            preload="auto"
            loop={false}
            muted={false}
            onEnded={handleVideoEnded}
            onError={handleVideoError}
          />

          {playBlocked && !showBridge && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,oklch(0.06_0.03_292/.78),oklch(0.12_0.07_300/.88))] px-6 text-center backdrop-blur-sm">
              <p className="font-serif text-2xl leading-relaxed text-[#f5eedc] text-balance">
                Veyra tiene un mensaje para ti.
              </p>
              <button
                onClick={handleRecoveryClick}
                className="flex w-full max-w-xs items-center justify-center gap-2 rounded-full border border-gold/70 bg-[linear-gradient(135deg,oklch(0.33_0.16_302/.96),oklch(0.18_0.08_295/.96))] px-5 py-4 text-center font-medium uppercase tracking-wide text-gold glow-violet transition-transform active:scale-95"
              >
                <Play className="size-4 fill-current" />
                REVELAR MENSAJE DE VEYRA
              </button>
            </div>
          )}

          {fallbackPending && !showBridge && (
            <div className="absolute inset-0 flex items-center justify-center bg-[linear-gradient(180deg,oklch(0.06_0.03_292/.78),oklch(0.12_0.07_300/.88))] px-6 text-center backdrop-blur-sm">
              <p className="font-serif text-2xl leading-relaxed text-[#f5eedc] text-balance">
                Veyra tiene un mensaje para ti.
              </p>
            </div>
          )}

          {showBridge && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6 bg-[linear-gradient(180deg,oklch(0.06_0.03_292/.72),oklch(0.12_0.07_300/.9))] px-6 text-center backdrop-blur-[2px]">
              <div className="space-y-4">
                {config.bridge.split("\n").map((line) => (
                  <p
                    key={line}
                    className="font-serif text-2xl leading-relaxed text-gold text-balance"
                  >
                    {line}
                  </p>
                ))}
              </div>
              <div className="space-y-2 border-t border-gold/15 pt-5">
                {config.shortText.split("\n").map((line) => (
                  <p
                    key={line}
                    className="text-sm leading-relaxed text-[#f5eedc]/88 text-balance"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          )}
        </div>

        {showBridge && (
          <button
            onClick={handleComplete}
            className="animate-float-up flex w-full items-center justify-center gap-2 rounded-full border border-gold/70 bg-[linear-gradient(135deg,oklch(0.33_0.16_302/.96),oklch(0.18_0.08_295/.96))] px-5 py-4 text-center font-medium uppercase tracking-wide text-gold glow-violet transition-transform active:scale-95"
          >
            ABRIR EL CAMINO HACIA JANNY
            <ArrowRight className="size-5" />
          </button>
        )}
      </div>
    </section>
  )
}
