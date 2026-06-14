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
  const [videoLoadFailed, setVideoLoadFailed] = useState(false)

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
    setVideoLoadFailed(false)

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
    setVideoLoadFailed(true)
    setShowBridge(true)
  }

  return (
    <section className="relative flex min-h-screen w-full min-w-[320px] justify-center overflow-hidden bg-mystic text-white">
      <div className="relative min-h-[100dvh] w-full max-w-[460px] overflow-hidden bg-black shadow-[0_0_80px_oklch(0.13_0.03_295_/_0.8)] md:border-x md:border-gold/10">
        <div className="pointer-events-none absolute inset-0 z-0 bg-[radial-gradient(circle_at_50%_28%,oklch(0.36_0.15_304/.34),transparent_34%),radial-gradient(circle_at_50%_78%,oklch(0.72_0.12_86/.12),transparent_34%),linear-gradient(180deg,oklch(0.06_0.03_292),oklch(0.12_0.07_300)_48%,oklch(0.05_0.02_292))]" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 z-0 size-[360px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/10 blur-[1px] access-portal" />

        <video
          ref={videoRef}
          src={config.video}
          className={`absolute inset-0 z-0 h-full w-full object-cover object-center transition-opacity duration-700 ${
            showBridge ? "opacity-40" : "opacity-100"
          } ${videoLoadFailed ? "opacity-0" : ""}`}
          playsInline
          controls={false}
          preload="auto"
          loop={false}
          muted={false}
          onEnded={handleVideoEnded}
          onError={handleVideoError}
        />

        <div className="pointer-events-none absolute inset-0 z-10 bg-black/10" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[radial-gradient(75%_70%_at_50%_43%,transparent_36%,oklch(0.05_0.02_295/.62)_100%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-56 bg-gradient-to-b from-black/70 via-black/25 to-transparent" />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-72 bg-gradient-to-t from-black/82 via-black/36 to-transparent" />
        <div className="pointer-events-none absolute inset-0 z-10 bg-[linear-gradient(180deg,oklch(0.13_0.07_302/.18),transparent_32%,oklch(0.12_0.06_300/.28))]" />
        <div className="pointer-events-none absolute inset-0 z-10">
          <Particles count={22} />
        </div>

        <div className="relative z-20 flex min-h-[100dvh] w-full flex-col justify-between px-5 pb-[max(2rem,env(safe-area-inset-bottom))] pt-[max(2.4rem,env(safe-area-inset-top))] sm:px-6">
          <header className="mx-auto max-w-[92%] text-center">
            <p className="text-[0.68rem] uppercase tracking-[0.3em] text-[#f5eedc]/80">
              Tu patrón dominante es:
            </p>
            <h1 className="mt-2 font-serif text-2xl leading-tight text-gold text-balance drop-shadow-[0_0_18px_oklch(0.05_0.02_292/.9)]">
              {info.title}
            </h1>
          </header>

          <div className="min-h-[34vh]" />

          {showBridge ? (
            <div className="animate-float-up space-y-5 text-center">
              <div className="space-y-3">
                {config.bridge.split("\n").map((line) => (
                  <p
                    key={line}
                    className="font-serif text-2xl leading-relaxed text-gold text-balance drop-shadow-[0_0_18px_oklch(0.05_0.02_292/.95)]"
                  >
                    {line}
                  </p>
                ))}
              </div>
              <div className="mx-auto max-w-sm space-y-2 border-t border-gold/20 pt-4">
                {config.shortText.split("\n").map((line) => (
                  <p
                    key={line}
                    className="text-sm leading-relaxed text-[#f5eedc]/88 text-balance drop-shadow-[0_0_12px_oklch(0.05_0.02_292/.95)]"
                  >
                    {line}
                  </p>
                ))}
              </div>
            </div>
          ) : (
            <div aria-hidden="true" />
          )}

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

        {playBlocked && !showBridge && (
          <div className="absolute inset-0 z-30 flex flex-col items-center justify-center gap-5 bg-[linear-gradient(180deg,oklch(0.06_0.03_292/.78),oklch(0.12_0.07_300/.9))] px-6 text-center backdrop-blur-sm">
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
          <div className="absolute inset-0 z-30 flex items-center justify-center bg-[linear-gradient(180deg,oklch(0.06_0.03_292/.78),oklch(0.12_0.07_300/.9))] px-6 text-center backdrop-blur-sm">
            <p className="font-serif text-2xl leading-relaxed text-[#f5eedc] text-balance">
              Veyra tiene un mensaje para ti.
            </p>
          </div>
        )}
      </div>
    </section>
  )
}
