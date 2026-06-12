"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Mic, Phone, PhoneOff, Volume2 } from "lucide-react"
import { Particles } from "./particles"

const CALL_AUDIO_SRC = "/audio/veyra-llamada-final.mp3"

type CallState = "incoming" | "active" | "ended"

type Exp2CallProps = {
  onComplete: () => void
  stopIntroAudio: () => void
}

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

function warnPlaybackFailure(error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn("[funnel] EXP 2 call audio playback failed", error)
  }
}

export function Exp2Call({ onComplete, stopIntroAudio }: Exp2CallProps) {
  const callAudioRef = useRef<HTMLAudioElement>(null)
  const acceptedRef = useRef(false)
  const endedRef = useRef(false)
  const [state, setState] = useState<CallState>("incoming")
  const [timer, setTimer] = useState(0)
  const [isSpeaking, setIsSpeaking] = useState(false)

  useEffect(() => {
    if (state !== "active") return

    const id = setInterval(() => {
      setTimer((t) => t + 1)
    }, 1000)

    return () => clearInterval(id)
  }, [state])

  useEffect(() => {
    return () => {
      callAudioRef.current?.pause()
    }
  }, [])

  const completeCall = useCallback(() => {
    if (endedRef.current) return

    endedRef.current = true
    setIsSpeaking(false)
    setState("ended")
    onComplete()
  }, [onComplete])

  const acceptCall = useCallback(() => {
    if (acceptedRef.current) return
    acceptedRef.current = true

    stopIntroAudio()
    setTimer(0)
    setState("active")
    setIsSpeaking(true)

    const audio = callAudioRef.current
    if (!audio) return

    try {
      audio.currentTime = 0
      void audio.play().catch((error: unknown) => {
        setIsSpeaking(false)
        warnPlaybackFailure(error)
      })
    } catch (error) {
      setIsSpeaking(false)
      warnPlaybackFailure(error)
    }
  }, [stopIntroAudio])

  const disabledControlClass =
    "pointer-events-none flex size-14 items-center justify-center rounded-full bg-secondary/70 text-secondary-foreground/55 opacity-70"

  return (
    <section className="relative flex min-h-screen w-full min-w-[320px] justify-center overflow-hidden bg-mystic">
      <audio
        ref={callAudioRef}
        src={CALL_AUDIO_SRC}
        preload="auto"
        onEnded={completeCall}
      />

      <div className="relative flex min-h-screen w-full max-w-[460px] flex-col items-center justify-between overflow-hidden bg-background px-6 py-12 shadow-[0_0_80px_oklch(0.13_0.03_295_/_0.8)] md:border-x md:border-gold/10">
        <div className="absolute inset-0 z-0">
          <Image
            src="/veyra-perfil.webp"
            alt=""
            fill
            priority
            aria-hidden="true"
            className="scale-110 object-cover blur-2xl"
          />
          <div className="absolute inset-0 bg-background/80" />
          <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_38%,oklch(0.32_0.12_300_/_0.45),transparent_70%)]" />
          <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
        </div>
        <Particles count={18} />

        <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7">
          <div className="relative">
            <div
              className={`absolute -inset-3 rounded-full ${
                isSpeaking || state === "incoming" ? "animate-halo-spin" : ""
              }`}
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, var(--gold), transparent 30%, transparent 60%, var(--primary), transparent)",
                opacity: isSpeaking ? 0.95 : 0.85,
              }}
              aria-hidden="true"
            />
            {isSpeaking && (
              <div
                className="absolute -inset-9 rounded-full border border-primary/40 animate-mystic-pulse"
                aria-hidden="true"
              />
            )}
            <div
              className={`relative overflow-hidden rounded-full border-2 border-gold/60 glow-violet ${
                isSpeaking || state === "incoming" ? "animate-mystic-pulse" : ""
              }`}
              style={{ width: 168, height: 168 }}
            >
              <Image
                src="/veyra-perfil.webp"
                alt="Veyra"
                fill
                priority
                className="object-cover"
              />
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 text-center">
            <h1 className="break-words font-serif text-5xl tracking-wide text-gold text-glow">
              VEYRA
            </h1>
            {state === "active" && (
              <span className="font-mono text-sm uppercase tracking-[0.3em] text-primary">
                {fmt(timer)}
              </span>
            )}
          </div>

          {state === "active" && (
            <div className="flex items-end gap-1.5" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-primary/80"
                  style={{
                    height: 8 + Math.abs(Math.sin(i + timer)) * 30,
                    animation: `mystic-pulse ${0.8 + (i % 5) * 0.15}s ease-in-out ${i * 0.05}s infinite`,
                  }}
                />
              ))}
            </div>
          )}
        </div>

        <div className="relative z-10 mb-6 w-full max-w-xs">
          {state === "incoming" ? (
            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={acceptCall}
                aria-label="Contestar llamada"
                className="flex size-[72px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg glow-violet animate-mystic-pulse transition-transform active:scale-90"
              >
                <Phone className="size-8" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-around">
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label="Silenciar"
                className={disabledControlClass}
              >
                <Mic className="size-6" />
              </button>
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label="Finalizar llamada"
                className="pointer-events-none flex size-16 items-center justify-center rounded-full bg-destructive/70 text-white/60 opacity-70"
              >
                <PhoneOff className="size-7" />
              </button>
              <button
                type="button"
                disabled
                aria-disabled="true"
                aria-label="Altavoz"
                className={disabledControlClass}
              >
                <Volume2 className="size-6" />
              </button>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
