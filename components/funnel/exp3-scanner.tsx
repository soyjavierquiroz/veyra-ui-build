"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Fingerprint, Sparkles } from "lucide-react"
import { Particles } from "./particles"

type ScannerPhase = "idle" | "scanning" | "revelation" | "complete"

type ScannerStep =
  | {
      from: number
      to: number
      kind: "scan" | "reveal"
      text: string
    }
  | {
      from: number
      to: number
      kind: "progress"
      percent: number
      bar: string
      text: string
    }

const SCANNER_AUDIO_SRC = process.env.NEXT_PUBLIC_SCANNER_AUDIO_SRC?.trim() ?? ""

const scannerSteps: ScannerStep[] = [
  { from: 0, to: 3, kind: "scan", text: "Iniciando lectura emocional…" },
  { from: 3, to: 6, kind: "scan", text: "Detectando actividad en el chat pendiente…" },
  {
    from: 6,
    to: 10,
    kind: "progress",
    percent: 20,
    bar: "[██░░░░░░░░]",
    text: "Señal encontrada: impulso de escribir desde ansiedad.",
  },
  {
    from: 10,
    to: 15,
    kind: "progress",
    percent: 40,
    bar: "[████░░░░░░]",
    text: "Nivel de urgencia emocional: alto.",
  },
  {
    from: 15,
    to: 20,
    kind: "progress",
    percent: 60,
    bar: "[██████░░░░]",
    text: "Necesidad detectada: respuesta, cierre o alivio inmediato.",
  },
  {
    from: 20,
    to: 25,
    kind: "progress",
    percent: 80,
    bar: "[████████░░]",
    text: "Riesgo actual: enviar un mensaje que después puede doler.",
  },
  {
    from: 25,
    to: 31,
    kind: "progress",
    percent: 100,
    bar: "[██████████]",
    text: "Lectura completada.",
  },
  {
    from: 31,
    to: 39,
    kind: "reveal",
    text: "“No estás fallando por falta de amor propio.\nEstás intentando actuar mientras tu emoción está activada.”",
  },
  {
    from: 39,
    to: 47,
    kind: "reveal",
    text: "“El impulso no siempre significa amor.\nA veces significa ansiedad buscando calma.”",
  },
]

function getActiveStep(elapsedSeconds: number) {
  return (
    scannerSteps.find(
      (step) => elapsedSeconds >= step.from && elapsedSeconds < step.to,
    ) ?? scannerSteps[scannerSteps.length - 1]
  )
}

function getPhase(elapsedSeconds: number): ScannerPhase {
  if (elapsedSeconds >= 47) return "complete"
  if (elapsedSeconds >= 31) return "revelation"
  return "scanning"
}

function getVisualProgress(step: ScannerStep, elapsedSeconds: number) {
  if (step.kind === "progress") return step.percent
  if (elapsedSeconds >= 31) return 100
  if (elapsedSeconds >= 6) return 20
  return Math.max(4, Math.round((elapsedSeconds / 6) * 18))
}

export function Exp3Scanner({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<ScannerPhase>("idle")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isActivating, setIsActivating] = useState(false)
  const [isScannerAudioReady, setIsScannerAudioReady] = useState(false)
  const startTimeRef = useRef<number | null>(null)
  const activationTimeoutRef = useRef<number | null>(null)
  const scannerAudioRef = useRef<HTMLAudioElement>(null)

  const activeStep = useMemo(() => getActiveStep(elapsedSeconds), [elapsedSeconds])
  const visualProgress = getVisualProgress(activeStep, elapsedSeconds)
  const isLocked = phase === "scanning" || phase === "revelation"

  useEffect(() => {
    if (phase === "idle" || phase === "complete") return

    const id = window.setInterval(() => {
      if (!startTimeRef.current) return

      const nextElapsed = (Date.now() - startTimeRef.current) / 1000
      setElapsedSeconds(nextElapsed)
      setPhase(getPhase(nextElapsed))
    }, 250)

    return () => window.clearInterval(id)
  }, [phase])

  useEffect(() => {
    return () => {
      if (activationTimeoutRef.current) {
        window.clearTimeout(activationTimeoutRef.current)
      }

      const audio = scannerAudioRef.current
      if (!audio) return
      audio.pause()
    }
  }, [])

  function startScanner() {
    if (phase !== "idle") return

    setIsActivating(true)

    activationTimeoutRef.current = window.setTimeout(() => {
      startTimeRef.current = Date.now()
      setElapsedSeconds(0)
      setPhase("scanning")
    }, 360)

    const audio = scannerAudioRef.current
    if (!audio || !SCANNER_AUDIO_SRC || !isScannerAudioReady) return

    audio.currentTime = 0
    void audio.play().catch((error: unknown) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[funnel] scanner audio playback failed", error)
      }
    })
  }

  return (
    <section className="relative flex h-[100dvh] w-full min-w-[320px] justify-center overflow-hidden bg-mystic text-foreground">
      <Particles count={14} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.08]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.7 0.16 300) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.16 300) 1px, transparent 1px)",
          backgroundSize: "34px 34px",
          maskImage: "radial-gradient(circle at center, black, transparent 76%)",
        }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-x-[-30%] top-[16%] h-80 rounded-full bg-primary/25 blur-3xl"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute bottom-[-28%] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
        aria-hidden="true"
      />

      {SCANNER_AUDIO_SRC && (
        <audio
          ref={scannerAudioRef}
          src={SCANNER_AUDIO_SRC}
          preload="metadata"
          onCanPlayThrough={() => setIsScannerAudioReady(true)}
          onError={() => setIsScannerAudioReady(false)}
        />
      )}

      <div
        className={`relative z-10 flex h-full w-full max-w-[430px] flex-col px-5 py-7 sm:border-x sm:border-white/10 sm:bg-black/10 ${
          isLocked ? "pointer-events-none select-none" : ""
        }`}
      >
        <header className="shrink-0 text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary/80">
            SCANNER EMOCIONAL
          </p>
          {phase === "idle" && (
            <p className="mx-auto mt-4 max-w-xs text-balance text-sm leading-relaxed text-muted-foreground">
              Coloca tu dedo pulgar sobre el scanner para iniciar.
            </p>
          )}
        </header>

        <div className="flex min-h-0 flex-1 flex-col items-center justify-center gap-7 py-6 text-center">
          {phase === "idle" ? (
            <button
              type="button"
              aria-label="Iniciar scanner emocional"
              onClick={startScanner}
              className={`relative flex size-44 shrink-0 items-center justify-center rounded-full border border-primary/60 bg-primary/15 text-primary glow-violet transition duration-300 active:scale-95 motion-safe:animate-mystic-pulse ${
                isActivating ? "scale-125 opacity-0 blur-sm" : ""
              }`}
            >
              <span
                className="absolute inset-4 rounded-full border border-primary/30"
                aria-hidden="true"
              />
              <span
                className="absolute inset-[-14px] rounded-full border border-primary/20 opacity-70"
                aria-hidden="true"
              />
              <Fingerprint className="size-24" strokeWidth={1.25} />
            </button>
          ) : (
            <div className="flex w-full flex-col items-center gap-7">
              <div
                className={`relative flex size-44 items-center justify-center rounded-full border border-primary/40 ${
                  phase === "revelation" || phase === "complete"
                    ? "bg-primary/10"
                    : "bg-primary/15 glow-violet"
                }`}
              >
                <div
                  className={`absolute inset-[-16px] rounded-full border border-primary/20 ${
                    phase === "scanning" ? "motion-safe:animate-halo-spin" : ""
                  }`}
                  style={{
                    background: `conic-gradient(oklch(0.62 0.18 300) ${visualProgress * 3.6}deg, transparent 0deg)`,
                    mask: "radial-gradient(farthest-side, transparent calc(100% - 2px), black calc(100% - 1px))",
                  }}
                  aria-hidden="true"
                />
                <div
                  className="absolute inset-8 rounded-full bg-primary/10 blur-md"
                  aria-hidden="true"
                />
                <Fingerprint
                  className={`relative size-20 text-primary ${
                    phase === "scanning" ? "animate-soft-blink" : "opacity-55"
                  }`}
                  strokeWidth={1.25}
                />
              </div>

              <div className="w-full max-w-sm">
                <div className="mb-5 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary via-primary to-gold transition-[width] duration-300"
                    style={{ width: `${visualProgress}%` }}
                  />
                </div>

                <div
                  key={`${activeStep.from}-${activeStep.text}`}
                  className={`animate-float-up whitespace-pre-line text-balance ${
                    activeStep.kind === "reveal" || phase === "complete"
                      ? "font-serif text-2xl leading-tight text-gold text-glow"
                      : "font-sans text-lg leading-relaxed text-foreground"
                  }`}
                >
                  {activeStep.kind === "progress" && (
                    <p className="mb-3 font-mono text-sm tracking-[0.18em] text-primary/90">
                      {activeStep.bar} {activeStep.percent}%
                    </p>
                  )}
                  <p>{activeStep.text}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <footer className="flex min-h-[112px] shrink-0 flex-col justify-end gap-4 pb-2">
          {phase === "complete" && (
            <>
              <button
                type="button"
                onClick={onComplete}
                className="animate-float-up flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
              >
                <Sparkles className="size-5" />
                Ver mi ruta emocional
              </button>
              <p className="animate-float-up text-center text-xs leading-relaxed text-muted-foreground">
                Esto no es un diagnóstico. Es una lectura simbólica para ayudarte a pausar antes de actuar.
              </p>
            </>
          )}
        </footer>
      </div>
    </section>
  )
}
