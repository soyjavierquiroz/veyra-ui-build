"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import { Mic, Phone, PhoneOff, Volume2 } from "lucide-react"
import { versionAsset } from "./asset-version"
import { Particles } from "./particles"

const CALL_AUDIO_SRC = versionAsset("/audio/veyra-llamada-final.mp3")
const CALL_VISUAL_END_SECONDS = 72
const CALL_PROGRESS_EASING_POWER = 2.2
const CALL_PROGRESS_SIZE = 204
const CALL_PROGRESS_STROKE = 7
const CALL_PROGRESS_RADIUS = (CALL_PROGRESS_SIZE - CALL_PROGRESS_STROKE) / 2
const CALL_PROGRESS_CIRCUMFERENCE = 2 * Math.PI * CALL_PROGRESS_RADIUS

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

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getCallProgress(elapsedSeconds: number) {
  const raw = clamp(elapsedSeconds / CALL_VISUAL_END_SECONDS, 0, 1)
  return 1 - Math.pow(1 - raw, CALL_PROGRESS_EASING_POWER)
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
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isVisuallyEnded, setIsVisuallyEnded] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const callProgress = getCallProgress(elapsedSeconds)
  const progressOffset = CALL_PROGRESS_CIRCUMFERENCE * (1 - callProgress)
  const displayedSeconds = isVisuallyEnded
    ? CALL_VISUAL_END_SECONDS
    : Math.floor(elapsedSeconds)

  useEffect(() => {
    if (state !== "active") return

    const id = setInterval(() => {
      const audio = callAudioRef.current
      const nextElapsed = audio?.currentTime ?? 0

      setElapsedSeconds(nextElapsed)

      if (nextElapsed >= CALL_VISUAL_END_SECONDS) {
        setIsVisuallyEnded(true)
        setIsSpeaking(false)
      }
    }, 250)

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
    setIsVisuallyEnded(true)
    setState("ended")
    onComplete()
  }, [onComplete])

  const acceptCall = useCallback(() => {
    if (acceptedRef.current) return
    acceptedRef.current = true

    stopIntroAudio()
    setElapsedSeconds(0)
    setIsVisuallyEnded(false)
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

  const avatarIsAnimated =
    (state === "incoming" || isSpeaking) && !isVisuallyEnded

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
                avatarIsAnimated ? "animate-halo-spin" : ""
              }`}
              style={{
                background:
                  "conic-gradient(from 0deg, transparent, oklch(0.72 0.22 305 / 0.92), transparent 30%, transparent 60%, oklch(0.58 0.26 292 / 0.86), transparent)",
                opacity: isVisuallyEnded ? 0.25 : isSpeaking ? 0.95 : 0.85,
              }}
              aria-hidden="true"
            />
            {state !== "incoming" && (
              <svg
                className="pointer-events-none absolute left-1/2 top-1/2 z-10 size-[204px] -translate-x-1/2 -translate-y-1/2 -rotate-90 overflow-visible"
                viewBox={`0 0 ${CALL_PROGRESS_SIZE} ${CALL_PROGRESS_SIZE}`}
                aria-hidden="true"
              >
                <circle
                  cx={CALL_PROGRESS_SIZE / 2}
                  cy={CALL_PROGRESS_SIZE / 2}
                  r={CALL_PROGRESS_RADIUS}
                  fill="none"
                  stroke="oklch(0.36 0.13 296 / 0.28)"
                  strokeWidth={CALL_PROGRESS_STROKE}
                />
                <circle
                  cx={CALL_PROGRESS_SIZE / 2}
                  cy={CALL_PROGRESS_SIZE / 2}
                  r={CALL_PROGRESS_RADIUS}
                  fill="none"
                  stroke={
                    isVisuallyEnded
                      ? "oklch(0.44 0.17 306 / 0.72)"
                      : "oklch(0.70 0.27 303 / 0.96)"
                  }
                  strokeWidth={CALL_PROGRESS_STROKE}
                  strokeLinecap="round"
                  strokeDasharray={CALL_PROGRESS_CIRCUMFERENCE}
                  strokeDashoffset={progressOffset}
                  className="drop-shadow-[0_0_16px_oklch(0.62_0.26_300_/_0.55)] transition-[stroke,stroke-dashoffset] duration-300 ease-out"
                />
              </svg>
            )}
            {isSpeaking && !isVisuallyEnded && (
              <div
                className="absolute -inset-9 rounded-full border border-primary/40 animate-mystic-pulse"
                aria-hidden="true"
              />
            )}
            <div
              className={`relative overflow-hidden rounded-full border-2 border-gold/60 glow-violet ${
                avatarIsAnimated ? "animate-mystic-pulse" : ""
              } ${
                isVisuallyEnded
                  ? "border-primary/25 opacity-80 grayscale saturate-0 brightness-75"
                  : ""
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
            {state === "active" && !isVisuallyEnded && (
              <span className="font-mono text-sm uppercase tracking-[0.3em] text-primary">
                {fmt(displayedSeconds)}
              </span>
            )}
            {state === "active" && isVisuallyEnded && (
              <span className="font-mono text-sm uppercase tracking-[0.24em] text-primary/80">
                LLAMADA FINALIZADA
              </span>
            )}
          </div>

          {state === "active" && !isVisuallyEnded && (
            <div className="flex items-end gap-1.5" aria-hidden="true">
              {Array.from({ length: 18 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1 rounded-full bg-primary/80"
                  style={{
                    height: 8 + Math.abs(Math.sin(i + displayedSeconds)) * 30,
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
