"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import { Fingerprint, Sparkles } from "lucide-react"
import { publicAssetPath } from "./asset-version"
import { trackFunnelEvent } from "./lib/analytics"
import { Particles } from "./particles"

type ScannerPhase =
  | "idle"
  | "activating"
  | "scanning"
  | "transitionToVeyra"
  | "veyraReveal"
  | "cta"

type ScannerStep =
  | {
      from: number
      to: number
      kind: "scan"
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

const SCANNER_AUDIO_SRC = publicAssetPath(
  "audio",
  "scanner-veyra-reveal-final.mp3",
)
const VEYRA_VIDEO_SRC = publicAssetPath(
  "videos",
  "veyra-scanner-reveal.mp4",
)
const VEYRA_POSTER_SRC = publicAssetPath(
  "images",
  "veyra-scanner-reveal-poster.webp",
)
const SCANNER_COMPLETE_SECONDS = 20.2
const VEYRA_VIDEO_START_SECONDS = 21.8
const VEYRA_REVEAL_FULL_SECONDS = 23.8
const CTA_SECONDS = 64.5

const scannerSteps: ScannerStep[] = [
  { from: 1, to: 2.7, kind: "scan", text: "Iniciando lectura emocional…" },
  {
    from: 2.9,
    to: 5.2,
    kind: "scan",
    text: "Detectando actividad en el chat pendiente…",
  },
  {
    from: 5.6,
    to: 8.2,
    kind: "progress",
    percent: 20,
    bar: "[██░░░░░░░░]",
    text: "Señal encontrada: impulso de escribir desde ansiedad.",
  },
  {
    from: 8.5,
    to: 10.5,
    kind: "progress",
    percent: 40,
    bar: "[████░░░░░░]",
    text: "Nivel de urgencia emocional: alto.",
  },
  {
    from: 11.1,
    to: 14.8,
    kind: "progress",
    percent: 60,
    bar: "[██████░░░░]",
    text: "Necesidad detectada: respuesta, cierre o alivio inmediato.",
  },
  {
    from: 15.25,
    to: 18.5,
    kind: "progress",
    percent: 80,
    bar: "[████████░░]",
    text: "Riesgo actual: enviar un mensaje que después puede doler.",
  },
  {
    from: 19.03,
    to: SCANNER_COMPLETE_SECONDS,
    kind: "progress",
    percent: 100,
    bar: "[██████████]",
    text: "Lectura completada.",
  },
]

const veyraCopyBlocks = [
  { from: 25.8, to: 27.5, text: "Escúchame." },
  { from: 27.6, to: 30, text: "El scanner no encontró un mensaje." },
  {
    from: 30.1,
    to: 32.7,
    text: "Encontró una emoción\nintentando decidir por ti.",
  },
  { from: 32.7, to: 35.8, text: "No ibas a escribir desde el amor." },
  { from: 35.8, to: 38.7, text: "Ibas a escribir desde la herida." },
  {
    from: 38.8,
    to: 41.8,
    text: "Ese impulso no te estaba acercando\na lo que deseas.",
  },
  {
    from: 41.9,
    to: 45.6,
    text: "Te estaba devolviendo\na lo que aún no has sanado.",
  },
  {
    from: 45.7,
    to: 49.8,
    text: "Yo puedo revelarte qué patrón\nestá tomando decisiones por ti.",
  },
  {
    from: 49.8,
    to: 53.3,
    text: "Pero no voy a abrir\nesa puerta para cualquiera.",
  },
  {
    from: 53.4,
    to: 58,
    text: "Si estás dispuesta a verte sin huir,\ncontinúa.",
  },
  {
    from: 58.1,
    to: 64.4,
    text: "Y si cruzas este umbral,\nabriré el camino\npara que Janny te guíe.",
  },
]

function getActiveStep(elapsedSeconds: number) {
  for (let i = scannerSteps.length - 1; i >= 0; i--) {
    if (elapsedSeconds >= scannerSteps[i].from) return scannerSteps[i]
  }
  return scannerSteps[0]
}

function getPhase(elapsedSeconds: number): ScannerPhase {
  if (elapsedSeconds >= CTA_SECONDS) return "cta"
  if (elapsedSeconds >= VEYRA_REVEAL_FULL_SECONDS) return "veyraReveal"
  if (elapsedSeconds >= SCANNER_COMPLETE_SECONDS) return "transitionToVeyra"
  return "scanning"
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getVeyraCopy(elapsedSeconds: number) {
  for (let i = veyraCopyBlocks.length - 1; i >= 0; i--) {
    if (elapsedSeconds >= veyraCopyBlocks[i].from) return veyraCopyBlocks[i]
  }
  return veyraCopyBlocks[0]
}

function getVisualProgress(step: ScannerStep, elapsedSeconds: number) {
  void step
  return Math.min(
    100,
    Math.max(4, Math.round((elapsedSeconds / SCANNER_COMPLETE_SECONDS) * 100)),
  )
}

export function Exp3Scanner({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<ScannerPhase>("idle")
  const [elapsedSeconds, setElapsedSeconds] = useState(0)
  const [isActivating, setIsActivating] = useState(false)
  const [videoEnded, setVideoEnded] = useState(false)
  const rafRef = useRef<number | null>(null)
  const hasStartedRef = useRef(false)
  const scannerAudioRef = useRef<HTMLAudioElement | null>(null)
  const veyraVideoRef = useRef<HTMLVideoElement | null>(null)
  const hasStartedVeyraVideoRef = useRef(false)

  const activeStep = useMemo(() => getActiveStep(elapsedSeconds), [elapsedSeconds])
  const activeVeyraCopy = useMemo(
    () => getVeyraCopy(elapsedSeconds),
    [elapsedSeconds],
  )
  const visualProgress = getVisualProgress(activeStep, elapsedSeconds)
  const isScannerFading = phase === "transitionToVeyra"
  const isScannerVisible = phase === "scanning" || isScannerFading
  const shouldStartVeyraVideo = elapsedSeconds >= VEYRA_VIDEO_START_SECONDS
  const isVeyraVisible = phase === "veyraReveal" || phase === "cta"
  const isCtaVisible = phase === "cta"
  const isPosterWait = shouldStartVeyraVideo && videoEnded
  const scannerFadeProgress = clamp(
    (elapsedSeconds - SCANNER_COMPLETE_SECONDS) /
      (VEYRA_REVEAL_FULL_SECONDS - SCANNER_COMPLETE_SECONDS),
    0,
    1,
  )
  const veyraFadeProgress = clamp(
    (elapsedSeconds - VEYRA_VIDEO_START_SECONDS) /
      (VEYRA_REVEAL_FULL_SECONDS - VEYRA_VIDEO_START_SECONDS),
    0,
    1,
  )
  const veyraVideoOpacity =
    shouldStartVeyraVideo && !videoEnded ? 0.18 + veyraFadeProgress * 0.82 : 0
  const veyraOverlayOpacity = shouldStartVeyraVideo
    ? 0.72 + veyraFadeProgress * 0.28
    : 0

  useEffect(() => {
    if (phase === "idle") return

    const tick = () => {
      const audio = scannerAudioRef.current
      const nextElapsed = audio?.currentTime ?? 0

      setElapsedSeconds(nextElapsed)
      setIsActivating(nextElapsed < 0.68)

      if (nextElapsed < 0.68) {
        setPhase("activating")
      } else {
        setPhase(getPhase(nextElapsed))
      }

      rafRef.current = window.requestAnimationFrame(tick)
    }

    rafRef.current = window.requestAnimationFrame(tick)

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }
    }
  }, [phase])

  useEffect(() => {
    const video = veyraVideoRef.current
    if (!video) return

    if (!shouldStartVeyraVideo) {
      if (hasStartedVeyraVideoRef.current) {
        video.pause()
        video.currentTime = 0
        hasStartedVeyraVideoRef.current = false
      }

      return
    }

    if (hasStartedVeyraVideoRef.current) return

    video.muted = true
    video.currentTime = 0
    setVideoEnded(false)
    hasStartedVeyraVideoRef.current = true

    void video.play().catch((error: unknown) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[funnel] Veyra reveal video playback failed", error)
      }
    })
  }, [shouldStartVeyraVideo])

  useEffect(() => {
    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current)
        rafRef.current = null
      }

      const audio = scannerAudioRef.current
      if (audio) {
        stopScannerAudio()
      }

      const video = veyraVideoRef.current
      if (video) {
        video.pause()
        video.currentTime = 0
      }
    }
  }, [])

  function startScannerAudio() {
    const audio = scannerAudioRef.current
    if (!audio) return

    audio.currentTime = 0
    void audio.play().catch((error: unknown) => {
      if (process.env.NODE_ENV !== "production") {
        console.warn("[funnel] scanner audio playback failed", error)
      }
    })
  }

  function stopScannerAudio() {
    const audio = scannerAudioRef.current
    if (!audio) return

    audio.pause()
    audio.currentTime = 0
  }

  function startScanner() {
    if (hasStartedRef.current || phase !== "idle") return

    hasStartedRef.current = true
    setIsActivating(true)
    setElapsedSeconds(0)
    setVideoEnded(false)
    setPhase("activating")
    trackFunnelEvent("scanner_started")
    startScannerAudio()
  }

  function handleCrossThreshold() {
    stopScannerAudio()
    const video = veyraVideoRef.current
    if (video) {
      video.pause()
      video.currentTime = 0
    }
    setVideoEnded(false)
    onComplete()
  }

  return (
    <div className="relative flex min-h-[100dvh] w-full min-w-[320px] justify-center overflow-hidden bg-black text-foreground">
      <section className="relative flex min-h-[100dvh] w-full max-w-[460px] overflow-hidden bg-[#07030d] sm:border-x sm:border-white/10">
        <video
          ref={veyraVideoRef}
          className="pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-100 ease-linear"
          src={VEYRA_VIDEO_SRC}
          poster={VEYRA_POSTER_SRC}
          muted
          playsInline
          preload="auto"
          style={{ opacity: veyraVideoOpacity }}
          onEnded={() => {
            setVideoEnded(true)
            const video = veyraVideoRef.current
            if (video) {
              video.pause()
            }
          }}
          aria-hidden="true"
        />
        <img
          className={`pointer-events-none absolute inset-0 h-full w-full object-cover object-center transition-opacity duration-1000 ${
            isPosterWait ? "opacity-100 animate-veyra-poster-wait" : "opacity-0"
          }`}
          src={VEYRA_POSTER_SRC}
          alt=""
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,transparent_0%,oklch(0.05_0.03_292_/_0.26)_44%,oklch(0.04_0.03_292_/_0.82)_100%)] transition-opacity duration-100 ease-linear"
          style={{ opacity: veyraOverlayOpacity }}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-[58%] bg-gradient-to-t from-black/88 via-black/52 to-transparent transition-opacity duration-100 ease-linear"
          style={{ opacity: veyraOverlayOpacity }}
          aria-hidden="true"
        />
        <Particles count={14} />
        <div
          className={`pointer-events-none absolute inset-0 transition-opacity duration-1000 ${
            isVeyraVisible ? "opacity-[0.025]" : "opacity-[0.08]"
          }`}
          style={{
            backgroundImage:
              "linear-gradient(oklch(0.7 0.16 300) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.16 300) 1px, transparent 1px)",
            backgroundSize: "34px 34px",
            maskImage: "radial-gradient(circle at center, black, transparent 76%)",
          }}
          aria-hidden="true"
        />
        <div
          className={`pointer-events-none absolute inset-x-[-30%] top-[16%] h-80 rounded-full bg-primary/25 blur-3xl transition-opacity duration-1000 ${
            isVeyraVisible ? "opacity-40" : "opacity-100"
          }`}
          aria-hidden="true"
        />
        <div
          className="pointer-events-none absolute bottom-[-28%] left-1/2 h-96 w-96 -translate-x-1/2 rounded-full bg-gold/10 blur-3xl"
          aria-hidden="true"
        />

        <audio ref={scannerAudioRef} src={SCANNER_AUDIO_SRC} preload="auto" />

        <div className="relative z-10 flex min-h-[100dvh] w-full flex-col px-5 py-7">
          <header
            className={`shrink-0 text-center transition-opacity duration-700 ${
              isVeyraVisible ? "opacity-0" : "opacity-100"
            }`}
          >
            <p className="text-xs font-semibold uppercase tracking-[0.32em] text-primary">
              SCANNER EMOCIONAL
            </p>
            {phase === "idle" && (
              <p className="mx-auto mt-4 max-w-xs text-balance text-base font-medium leading-relaxed text-foreground/90">
                Presiona la huella digital con uno de tus dedos.
              </p>
            )}
          </header>

          <div className="relative flex min-h-0 flex-1 flex-col items-center justify-center gap-7 py-6 text-center">
            {(phase === "idle" || phase === "activating") && (
              <button
                type="button"
                aria-label="Iniciar scanner emocional"
                aria-disabled={isActivating}
                disabled={isActivating}
                onClick={(event) => {
                  event.preventDefault()
                  startScanner()
                }}
                className={`scanner-touch-idle relative flex size-48 shrink-0 items-center justify-center rounded-full border border-primary/80 bg-primary/20 text-primary transition duration-300 active:scale-95 ${
                  isActivating ? "animate-scanner-release" : ""
                }`}
              >
                <span
                  className="pointer-events-none absolute inset-[-22px] rounded-full border border-primary/35 opacity-80 animate-scanner-ring-spin"
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute inset-[-38px] rounded-full border border-primary/20 opacity-70 animate-scanner-halo"
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute inset-5 rounded-full border border-gold/30 bg-primary/10"
                  aria-hidden="true"
                />
                <span
                  className="pointer-events-none absolute inset-0 overflow-hidden rounded-full"
                  aria-hidden="true"
                >
                  <span className="absolute -left-1/2 top-0 h-full w-1/2 rotate-12 bg-white/20 blur-xl animate-scanner-shimmer" />
                </span>
                {isActivating && (
                  <span
                    className="pointer-events-none absolute inset-0 rounded-full border border-primary/90 animate-scanner-wave"
                    aria-hidden="true"
                  />
                )}
                <Fingerprint
                  className="pointer-events-none relative size-28 drop-shadow-[0_0_22px_oklch(0.72_0.2_300_/_0.85)]"
                  strokeWidth={1.4}
                />
              </button>
            )}

            {phase !== "idle" && phase !== "activating" && (
              <div
                className={`flex w-full flex-col items-center gap-8 ${
                  isScannerFading ? "pointer-events-none" : ""
                }`}
                style={{
                  opacity: isScannerVisible ? 1 - scannerFadeProgress : 0,
                  transform: `scale(${1 - scannerFadeProgress * 0.05})`,
                  filter: `blur(${scannerFadeProgress * 8}px)`,
                  transition: "opacity 100ms linear, transform 100ms linear, filter 100ms linear",
                }}
              >
                <div
                  className={`relative flex size-44 items-center justify-center rounded-full border border-primary/60 ${
                    isScannerFading
                      ? "animate-scanner-fragment bg-primary/10 shadow-[0_0_46px_oklch(0.82_0.12_85_/_0.34)]"
                      : "bg-primary/20 glow-violet"
                  }`}
                >
                  <div
                    className={`pointer-events-none absolute inset-[-18px] rounded-full border border-primary/40 ${
                      phase === "scanning" ? "motion-safe:animate-halo-spin" : ""
                    }`}
                    style={{
                      background: `conic-gradient(oklch(0.82 0.12 85) 0deg, oklch(0.7 0.2 300) ${visualProgress * 3.6}deg, transparent 0deg)`,
                      mask: "radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 1px))",
                      filter: "drop-shadow(0 0 14px oklch(0.7 0.2 300 / 0.72))",
                    }}
                    aria-hidden="true"
                  />
                  <div
                    className="pointer-events-none absolute inset-7 rounded-full bg-primary/20 blur-md"
                    aria-hidden="true"
                  />
                  <Fingerprint
                    className={`relative size-20 text-primary drop-shadow-[0_0_18px_oklch(0.72_0.2_300_/_0.7)] ${
                      phase === "scanning" ? "animate-soft-blink" : "opacity-65"
                    }`}
                    strokeWidth={1.35}
                  />
                </div>

                <div className="w-full max-w-sm">
                  <div className="mb-6 h-2.5 overflow-hidden rounded-full border border-primary/25 bg-black/45 shadow-inner">
                    <div
                      className={`h-full rounded-full bg-gradient-to-r from-[oklch(0.62_0.18_300)] via-[oklch(0.78_0.18_315)] to-gold shadow-[0_0_18px_oklch(0.7_0.2_300_/_0.78)] transition-all duration-500 ${
                        isScannerFading ? "opacity-0" : "opacity-100"
                      }`}
                      style={{ width: `${visualProgress}%` }}
                    />
                  </div>

                  <div
                    key={`${activeStep.from}-${activeStep.text}`}
                    className="animate-float-up whitespace-pre-line text-balance font-sans text-xl font-semibold leading-snug text-foreground drop-shadow-[0_0_16px_oklch(0.7_0.16_300_/_0.3)]"
                  >
                    {activeStep.kind === "progress" && (
                      <p className="mb-4 font-mono text-base font-bold tracking-[0.16em] text-gold drop-shadow-[0_0_12px_oklch(0.82_0.12_85_/_0.55)]">
                        {activeStep.bar} {activeStep.percent}%
                      </p>
                    )}
                    <p>{activeStep.text}</p>
                  </div>
                </div>
              </div>
            )}

            {isScannerFading && (
              <div
                className="pointer-events-none absolute inset-0 flex items-center justify-center"
                aria-hidden="true"
              >
                <span className="size-64 rounded-full bg-gold/10 blur-3xl animate-veyra-flash" />
              </div>
            )}

            {isVeyraVisible && (
              <div className="absolute inset-x-0 bottom-0 flex min-h-[44%] flex-col justify-end pb-2 text-center">
                <div
                  key={`${activeVeyraCopy.from}-${activeVeyraCopy.text}`}
                  className="animate-float-up whitespace-pre-line text-balance px-1 font-serif text-[2rem] font-semibold leading-[1.04] text-gold text-glow drop-shadow-[0_12px_28px_rgba(0,0,0,0.75)]"
                >
                  {activeVeyraCopy.text}
                </div>
                {isCtaVisible && (
                  <div className="mt-8 animate-float-up">
                    <button
                      type="button"
                      onClick={handleCrossThreshold}
                      className="cta-scanner-final relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full py-4 text-sm font-bold uppercase tracking-[0.16em] transition-transform active:scale-95"
                    >
                      <span
                        className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-gold/30 to-transparent animate-scanner-shimmer"
                        aria-hidden="true"
                      />
                      <Sparkles className="relative size-5" />
                      <span className="relative">CRUZAR EL UMBRAL</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          <footer className="min-h-[24px] shrink-0" />
        </div>
      </section>
    </div>
  )
}
