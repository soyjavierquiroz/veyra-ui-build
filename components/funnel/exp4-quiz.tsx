"use client"

import { useEffect, useRef, useState } from "react"
import type { PatternKey } from "./types"
import { trackFunnelEvent } from "./lib/analytics"
import { Particles } from "./particles"

type Q = {
  prompt: string
  options: { key: PatternKey; text: string }[]
  micro?: string
}

const QUESTIONS: Q[] = [
  {
    prompt:
      "Cuando él no responde, no aparece o se muestra distante… ¿qué se activa más fuerte en ti?",
    options: [
      { key: "A", text: "Miedo de que me olvide." },
      { key: "B", text: "Necesidad de saber si todavía le importo." },
      { key: "C", text: "Ganas de pedir una explicación." },
      { key: "D", text: "Culpa por alejarme." },
      { key: "E", text: "Nostalgia por lo bonito." },
      { key: "F", text: "Ansiedad en el cuerpo." },
    ],
    micro: "Respira. Esta respuesta también habla de ti.",
  },
  {
    prompt: "Antes de escribirle, ¿qué frase aparece dentro de ti?",
    options: [
      { key: "A", text: "“¿Y si me reemplaza?”" },
      { key: "B", text: "“Necesito una señal.”" },
      { key: "C", text: "“Necesito cerrar esto.”" },
      { key: "D", text: "“Tal vez fui muy dura.”" },
      { key: "E", text: "“No todo fue malo.”" },
      { key: "F", text: "“No aguanto esta sensación.”" },
    ],
    micro: "No estás siendo juzgada. Estás siendo leída.",
  },
  {
    prompt: "Después de escribirle, normalmente sientes…",
    options: [
      { key: "A", text: "Alivio breve y luego miedo." },
      { key: "B", text: "Esperanza si responde, caída si no." },
      { key: "C", text: "Más preguntas." },
      { key: "D", text: "Culpa mezclada con confusión." },
      { key: "E", text: "Más nostalgia." },
      { key: "F", text: "Calma por minutos y luego ansiedad." },
    ],
    micro: "Lo que ocurre después también revela el patrón.",
  },
  {
    prompt: "Lo que más te cuesta soltar no es solo a él, sino…",
    options: [
      { key: "A", text: "La idea de ser olvidada." },
      { key: "B", text: "La necesidad de sentirme elegida." },
      { key: "C", text: "La pregunta que quedó abierta." },
      { key: "D", text: "La sensación de haber fallado." },
      { key: "E", text: "La versión bonita de la historia." },
      { key: "F", text: "La incomodidad de no hacer nada." },
    ],
    micro: "Sigue. Estás llegando al centro del impulso.",
  },
  {
    prompt:
      "Cuando prometes no escribirle y aun así vuelven las ganas, sientes que…",
    options: [
      { key: "A", text: "Si no hago algo, lo pierdo." },
      { key: "B", text: "Si responde, voy a calmarme." },
      { key: "C", text: "Si no hablo, no podré cerrar." },
      { key: "D", text: "Si no escribo, soy mala." },
      { key: "E", text: "Si lo recuerdo bonito, quiero volver." },
      { key: "F", text: "Si no escribo, mi cuerpo no descansa." },
    ],
  },
]

type Phase = "intro" | "quiz" | "ready"
type IntroStep = "threshold" | "title" | "block1" | "block2" | "block3" | "block4"

const READ_SPEED_CHARS_PER_SECOND = 13
const MIN_REVEAL_SECONDS = 3.2
const INTRO_TOTAL_MS = 22500
const ANSWER_SELECTION_MS = 700
const NO_MICRO_FEEDBACK_MS = 3800
const INTRO_TIMINGS: { at: number; step: IntroStep }[] = [
  { at: 2800, step: "title" },
  { at: 6200, step: "block1" },
  { at: 10200, step: "block2" },
  { at: 15000, step: "block3" },
  { at: 20500, step: "block4" },
]
function getReadableSeconds(text: string, min = MIN_REVEAL_SECONDS) {
  return Math.max(min, text.length / READ_SPEED_CHARS_PER_SECOND)
}

function dominant(answers: PatternKey[]): PatternKey {
  const counts: Record<string, number> = {}
  for (const a of answers) counts[a] = (counts[a] || 0) + 1
  let max = 0
  for (const k in counts) max = Math.max(max, counts[k])
  // tie -> last selected with max count
  for (let i = answers.length - 1; i >= 0; i--) {
    if (counts[answers[i]] === max) return answers[i]
  }
  return answers[answers.length - 1]
}

export function Exp4Quiz({
  onAnswerSelected,
  onPatternReady,
  onComplete,
}: {
  onAnswerSelected?: (questionIndex: number) => void
  onPatternReady?: (p: PatternKey) => void
  onComplete: (p: PatternKey) => void
}) {
  const [phase, setPhase] = useState<Phase>("intro")
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<PatternKey[]>([])
  const [micro, setMicro] = useState<string | null>(null)
  const [introStep, setIntroStep] = useState<IntroStep>("threshold")
  const [selectedKey, setSelectedKey] = useState<PatternKey | null>(null)
  const answerInFlightRef = useRef(false)
  const answerTimersRef = useRef<number[]>([])

  const scheduleAnswerTimer = (callback: () => void, delay: number) => {
    const timer = window.setTimeout(() => {
      answerTimersRef.current = answerTimersRef.current.filter((id) => id !== timer)
      callback()
    }, delay)

    answerTimersRef.current.push(timer)
  }

  useEffect(() => {
    return () => {
      answerTimersRef.current.forEach((timer) => window.clearTimeout(timer))
      answerTimersRef.current = []
    }
  }, [])

  useEffect(() => {
    if (phase !== "intro") return

    setIntroStep("threshold")
    const timers = INTRO_TIMINGS.map(({ at, step }) =>
      window.setTimeout(() => setIntroStep(step), at),
    )
    const finishTimer = window.setTimeout(() => {
      trackFunnelEvent("quiz_started")
      setPhase("quiz")
    }, INTRO_TOTAL_MS)

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
      window.clearTimeout(finishTimer)
    }
  }, [phase])

  const handleAnswer = (q: Q, key: PatternKey) => {
    if (selectedKey || micro || answerInFlightRef.current) return

    answerInFlightRef.current = true
    const next = [...answers, key]
    setSelectedKey(key)
    trackFunnelEvent("quiz_answered", {
      questionIndex: index,
      answer: key,
    })
    onAnswerSelected?.(index)
    setAnswers(next)
    scheduleAnswerTimer(() => {
      setSelectedKey(null)
      if (q.micro) {
        const microMinSeconds = q.micro.length > 44 ? 4 : MIN_REVEAL_SECONDS
        const microDurationMs = getReadableSeconds(q.micro, microMinSeconds) * 1000
        setMicro(q.micro)
        scheduleAnswerTimer(() => {
          setMicro(null)
          advance(next)
        }, microDurationMs)
      } else {
        scheduleAnswerTimer(() => advance(next), NO_MICRO_FEEDBACK_MS - ANSWER_SELECTION_MS)
      }
    }, ANSWER_SELECTION_MS)
  }

  const advance = (next: PatternKey[]) => {
    answerInFlightRef.current = false
    if (index < QUESTIONS.length - 1) {
      setIndex((i) => i + 1)
    } else {
      const result = dominant(next)
      onPatternReady?.(result)
      setPhase("ready")
      onComplete(result)
    }
  }

  if (phase === "intro") {
    return (
      <section className="access-chamber relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6 py-12">
        <Particles count={28} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_34%,oklch(0.38_0.16_304/.48),transparent_34%),radial-gradient(circle_at_50%_58%,oklch(0.76_0.12_86/.16),transparent_28%),linear-gradient(180deg,oklch(0.06_0.03_292)_0%,oklch(0.13_0.08_300)_50%,oklch(0.05_0.02_292)_100%)]" />
        <div className="access-flash pointer-events-none absolute inset-0" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[290px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/20 blur-[1px] access-portal" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-[218px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-fuchsia-300/20 access-portal access-portal-inner" />
        <div className="pointer-events-none absolute left-1/2 top-1/2 size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.88_0.12_86/.82),oklch(0.5_0.2_304/.34)_46%,transparent_70%)] blur-sm access-orb" />

        <div className="relative z-10 flex min-h-[300px] w-full max-w-[430px] flex-col items-center justify-center text-center">
          {introStep === "threshold" && (
            <h1 className="access-copy access-title font-serif text-3xl tracking-[0.18em] text-gold text-balance sm:text-4xl">
              UMBRAL CRUZADO
            </h1>
          )}

          {introStep === "title" && (
            <div className="access-copy flex flex-col items-center gap-4">
              <span className="rounded-full border border-gold/30 px-4 py-1 font-serif text-xs tracking-[0.34em] text-gold/80">
                VEYRA
              </span>
              <h1 className="font-serif text-3xl tracking-[0.14em] text-gold text-balance sm:text-4xl">
                EVALUACIÓN DE ACCESO
              </h1>
            </div>
          )}

          {introStep === "block1" && (
            <p className="access-copy max-w-xs font-serif text-2xl leading-relaxed text-[#f5eedc] text-balance">
              Tu impulso no apareció de la nada.
            </p>
          )}

          {introStep === "block2" && (
            <p className="access-copy max-w-xs font-serif text-2xl leading-relaxed text-[#f5eedc] text-balance">
              Responde con verdad.
              <br />
              No para quedar bien.
            </p>
          )}

          {introStep === "block3" && (
            <p className="access-copy max-w-xs font-serif text-2xl leading-relaxed text-[#f5eedc] text-balance">
              Cada elección revelará
              <br />
              qué emoción intenta decidir por ti.
            </p>
          )}

          {introStep === "block4" && (
            <p className="access-copy max-w-xs font-serif text-2xl leading-relaxed text-gold text-balance">
              La lectura comienza ahora.
            </p>
          )}
        </div>
      </section>
    )
  }

  if (phase === "ready") {
    return (
      <section className="access-chamber relative flex min-h-screen flex-col items-center justify-center overflow-hidden px-6">
        <Particles count={24} />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_36%,oklch(0.38_0.16_304/.36),transparent_35%),linear-gradient(180deg,oklch(0.06_0.03_292),oklch(0.12_0.07_300),oklch(0.05_0.02_292))]" />
        <div className="pointer-events-none absolute left-1/2 top-[42%] size-[230px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-gold/20 access-portal" />
        <div className="pointer-events-none absolute left-1/2 top-[42%] size-24 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,oklch(0.82_0.12_86/.72),oklch(0.5_0.18_304/.22)_48%,transparent_70%)] blur-sm access-orb" />
        <div className="relative z-10 flex w-full max-w-sm flex-col items-center text-center">
          <span className="mb-8 rounded-full border border-gold/25 px-4 py-1 font-serif text-xs uppercase tracking-[0.3em] text-gold/80">
            Evaluación de acceso
          </span>
          <div className="animate-float-up flex min-h-[210px] flex-col items-center justify-center gap-5">
            <p className="font-serif text-3xl leading-tight text-gold text-balance">
              Lectura lista.
            </p>
            <p className="text-base leading-relaxed text-[#f5eedc] text-balance">
              Tu patrón dominante fue detectado.
            </p>
            <p className="font-serif text-xl leading-relaxed text-[#f5eedc] text-balance">
              Veyra tiene un mensaje para ti.
            </p>
          </div>
        </div>
      </section>
    )
  }

  const q = QUESTIONS[index]
  return (
    <section className="access-chamber relative flex min-h-screen flex-col overflow-hidden px-4 py-7 sm:px-5 sm:py-10">
      <Particles count={18} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_16%,oklch(0.36_0.15_304/.34),transparent_30%),radial-gradient(circle_at_50%_78%,oklch(0.72_0.12_86/.10),transparent_34%),linear-gradient(180deg,oklch(0.06_0.03_292),oklch(0.12_0.07_300)_48%,oklch(0.05_0.02_292))]" />
      <div className="pointer-events-none absolute -top-20 left-1/2 size-[320px] -translate-x-1/2 rounded-full border border-fuchsia-300/10 blur-[1px] access-portal" />
      <div className="relative z-10 mx-auto flex w-full max-w-[460px] flex-1 flex-col">
        {/* Progress */}
        <div className="mb-3 flex items-center justify-between gap-4">
          <div>
            <p className="font-serif text-sm uppercase tracking-[0.24em] text-gold">
              EVALUACIÓN DE ACCESO
            </p>
            <p className="mt-1 text-[0.68rem] uppercase tracking-[0.28em] text-[#cfc3d6]/70">
              {index + 1} DE {QUESTIONS.length}
            </p>
          </div>
          <span className="rounded-full border border-gold/25 bg-black/20 px-3 py-1 font-serif text-xs uppercase tracking-[0.24em] text-gold/80 shadow-[0_0_18px_oklch(0.82_0.12_86/.16)]">
            VEYRA
          </span>
        </div>
        <div className="mb-7 h-2 w-full overflow-hidden rounded-full border border-white/5 bg-black/35 shadow-[inset_0_0_16px_oklch(0.05_0.02_292/.8)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.45_0.18_304),oklch(0.82_0.12_86),oklch(0.54_0.19_310))] shadow-[0_0_18px_oklch(0.82_0.12_86/.42)] transition-[width] duration-700 ease-out"
            style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>

        {micro ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="animate-float-up max-w-xs text-balance text-center font-serif text-2xl leading-relaxed text-gold text-glow break-words">
              {micro}
            </p>
          </div>
        ) : (
          <div key={index} className="animate-float-up flex flex-1 flex-col">
            <div className="mb-5 rounded-2xl border border-gold/20 bg-[linear-gradient(180deg,oklch(0.16_0.07_298/.78),oklch(0.09_0.04_292/.74))] p-5 shadow-[0_0_32px_oklch(0.45_0.18_304/.22),inset_0_0_28px_oklch(0.82_0.12_86/.06)] backdrop-blur">
              <p className="text-pretty font-serif text-xl leading-relaxed text-[#f5eedc] break-words">
                {q.prompt}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {q.options.map((opt) => {
                const selected = selectedKey === opt.key

                return (
                  <button
                    key={opt.key}
                    onClick={() => handleAnswer(q, opt.key)}
                    disabled={Boolean(selectedKey)}
                    className={`group flex min-h-14 items-center gap-3 rounded-2xl border px-4 py-4 text-left text-[#f5eedc] shadow-[inset_0_0_18px_oklch(0.82_0.12_86/.04)] transition-all duration-200 active:scale-[0.98] disabled:cursor-default ${
                      selected
                        ? "access-option-selected border-gold/75 bg-[linear-gradient(135deg,oklch(0.26_0.13_302/.9),oklch(0.16_0.08_292/.86))] shadow-[0_0_26px_oklch(0.82_0.12_86/.24),0_0_40px_oklch(0.54_0.19_310/.2)]"
                        : "border-fuchsia-200/15 bg-black/24 hover:border-gold/45 hover:bg-[oklch(0.18_0.08_298/.62)] hover:shadow-[0_0_20px_oklch(0.5_0.18_304/.16)]"
                    }`}
                  >
                    <span
                      className={`flex size-8 shrink-0 items-center justify-center rounded-full border font-serif text-xs font-semibold transition-all ${
                        selected
                          ? "border-gold bg-gold/20 text-gold shadow-[0_0_16px_oklch(0.82_0.12_86/.36)]"
                          : "border-gold/35 text-gold/85 group-hover:border-gold/70"
                      }`}
                    >
                      {opt.key}
                    </span>
                    <span className="text-sm leading-relaxed break-words">
                      {opt.text}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
