"use client"

import { useEffect, useRef, useState } from "react"
import { LoaderCircle } from "lucide-react"
import type { PatternKey } from "./types"
import { trackFunnelEvent } from "./lib/analytics"
import { Particles } from "./particles"

type Q = {
  prompt: string
  options: { key: PatternKey; text: string }[]
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
  },
]

const ANSWER_SELECTION_MS = 360
const LOADING_COPY = "Veyra está abriendo tu lectura..."

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
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<PatternKey[]>([])
  const [selectedKey, setSelectedKey] = useState<PatternKey | null>(null)
  const answerInFlightRef = useRef(false)
  const answerTimersRef = useRef<number[]>([])
  const quizStartedTrackedRef = useRef(false)

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
    if (!quizStartedTrackedRef.current) {
      quizStartedTrackedRef.current = true
      trackFunnelEvent("quiz_started")
    }
  }, [])

  const handleAnswer = (key: PatternKey) => {
    if (selectedKey || answerInFlightRef.current) return

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
      advance(next)
    }, ANSWER_SELECTION_MS)
  }

  const advance = (next: PatternKey[]) => {
    answerInFlightRef.current = false
    if (index < QUESTIONS.length - 1) {
      setIndex((i) => i + 1)
    } else {
      const result = dominant(next)
      onPatternReady?.(result)
      onComplete(result)
    }
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
              Paso {index + 1} de {QUESTIONS.length}
            </p>
          </div>
          <span className="pointer-events-none rounded-full border border-gold/25 bg-black/20 px-3 py-1 font-serif text-xs uppercase tracking-[0.24em] text-gold/80 shadow-[0_0_18px_oklch(0.82_0.12_86/.16)]">
            VEYRA
          </span>
        </div>
        <div className="mb-7 h-2 w-full overflow-hidden rounded-full border border-white/5 bg-black/35 shadow-[inset_0_0_16px_oklch(0.05_0.02_292/.8)]">
          <div
            className="h-full rounded-full bg-[linear-gradient(90deg,oklch(0.45_0.18_304),oklch(0.82_0.12_86),oklch(0.54_0.19_310))] shadow-[0_0_18px_oklch(0.82_0.12_86/.42)] transition-[width] duration-700 ease-out"
            style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>

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
                  onClick={() => handleAnswer(opt.key)}
                  disabled={Boolean(selectedKey)}
                  aria-busy={selected}
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
                    {selected ? (
                      <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />
                    ) : (
                      opt.key
                    )}
                  </span>
                  <span className="text-sm leading-relaxed break-words">
                    {selected ? LOADING_COPY : opt.text}
                  </span>
                </button>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
