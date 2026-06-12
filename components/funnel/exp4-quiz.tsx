"use client"

import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import type { PatternKey } from "./types"
import { VeyraOrb } from "./veyra-orb"
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

type Phase = "intro" | "quiz" | "processing"

const PROCESSING = [
  "Analizando respuestas…",
  "Detectando patrón dominante…",
  "Cruzando impulso + emoción + señal activa…",
  "Lectura revelada lista.",
]

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
  onComplete,
}: {
  onComplete: (p: PatternKey) => void
}) {
  const [phase, setPhase] = useState<Phase>("intro")
  const [index, setIndex] = useState(0)
  const [answers, setAnswers] = useState<PatternKey[]>([])
  const [micro, setMicro] = useState<string | null>(null)
  const [procStep, setProcStep] = useState(0)

  useEffect(() => {
    if (phase !== "processing") return
    const id = setInterval(() => {
      setProcStep((s) => {
        if (s >= PROCESSING.length - 1) {
          clearInterval(id)
          return s
        }
        return s + 1
      })
    }, 900)
    return () => clearInterval(id)
  }, [phase])

  const handleAnswer = (q: Q, key: PatternKey) => {
    const next = [...answers, key]
    setAnswers(next)
    if (q.micro) {
      setMicro(q.micro)
      setTimeout(() => {
        setMicro(null)
        advance(next)
      }, 1300)
    } else {
      advance(next)
    }
  }

  const advance = (next: PatternKey[]) => {
    if (index < QUESTIONS.length - 1) {
      setIndex((i) => i + 1)
    } else {
      setPhase("processing")
    }
  }

  if (phase === "intro") {
    return (
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6 py-12">
        <Particles count={16} />
        <div className="relative z-10 flex max-w-md flex-col items-center text-center">
          <VeyraOrb size={120} active className="mb-6" />
          <h1 className="mb-5 font-serif text-3xl text-gold text-balance">
            Tu impulso no apareció de la nada.
          </h1>
          <p className="mb-3 leading-relaxed text-muted-foreground break-words">
            A veces una mujer cree que quiere mandar un mensaje… pero lo que
            realmente quiere es calmar una parte de sí que se sintió ignorada,
            olvidada, culpable o ansiosa.
          </p>
          <p className="mb-8 leading-relaxed text-foreground break-words">
            No respondas para quedar bien.
            <br />
            Responde para verte.
          </p>
          <button
            onClick={() => setPhase("quiz")}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
          >
            Empezar lectura
            <ArrowRight className="size-5" />
          </button>
        </div>
      </section>
    )
  }

  if (phase === "processing") {
    return (
      <section className="relative flex min-h-screen flex-col items-center justify-center px-6">
        <Particles count={20} />
        <div className="relative z-10 flex max-w-sm flex-col items-center text-center">
          <VeyraOrb size={150} active className="mb-8" />
          <div className="min-h-[120px] space-y-3 font-mono text-sm">
            {PROCESSING.slice(0, procStep + 1).map((t, i) => (
              <p
                key={i}
                className={`animate-float-up break-words ${
                  i === PROCESSING.length - 1 && procStep === PROCESSING.length - 1
                    ? "font-serif text-base text-gold"
                    : "text-muted-foreground"
                }`}
              >
                {t}
              </p>
            ))}
          </div>
          {procStep >= PROCESSING.length - 1 && (
            <button
              onClick={() => onComplete(dominant(answers))}
              className="animate-float-up mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
            >
              Ver mi lectura
              <ArrowRight className="size-5" />
            </button>
          )}
        </div>
      </section>
    )
  }

  const q = QUESTIONS[index]
  return (
    <section className="relative flex min-h-screen flex-col px-5 py-10">
      <Particles count={12} />
      <div className="relative z-10 mx-auto flex w-full max-w-md flex-1 flex-col">
        {/* Progress */}
        <div className="mb-2 flex items-center justify-between">
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            {index + 1} de {QUESTIONS.length}
          </span>
          <span className="font-serif text-lg text-gold">VEYRA</span>
        </div>
        <div className="mb-8 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-primary to-gold transition-[width] duration-500"
            style={{ width: `${((index + 1) / QUESTIONS.length) * 100}%` }}
          />
        </div>

        {micro ? (
          <div className="flex flex-1 items-center justify-center">
            <p className="animate-float-up max-w-xs text-balance text-center font-serif text-2xl leading-relaxed text-glow break-words">
              {micro}
            </p>
          </div>
        ) : (
          <div key={index} className="animate-float-up flex flex-1 flex-col">
            <div className="mb-6 rounded-2xl border border-border bg-card/60 p-5 backdrop-blur">
              <p className="text-pretty text-lg leading-relaxed break-words">
                {q.prompt}
              </p>
            </div>
            <div className="flex flex-col gap-3">
              {q.options.map((opt) => (
                <button
                  key={opt.key}
                  onClick={() => handleAnswer(q, opt.key)}
                  className="group flex items-center gap-3 rounded-xl border border-border bg-secondary/50 px-4 py-4 text-left transition-all active:scale-[0.98] hover:border-primary/60 hover:bg-secondary"
                >
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-full border border-primary/50 text-xs font-semibold text-primary">
                    {opt.key}
                  </span>
                  <span className="text-sm leading-relaxed break-words">
                    {opt.text}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
