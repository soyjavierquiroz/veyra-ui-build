"use client"

import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import type { PatternKey } from "./types"
import { PATTERNS } from "./types"
import { VeyraOrb } from "./veyra-orb"
import { Particles } from "./particles"

const GENERAL = [
  "Tu mensaje no era solo un mensaje.",
  "Era una parte de ti intentando encontrar alivio.",
  "No querías perder tu dignidad.",
  "No querías humillarte.",
  "No querías volver a romperte.",
  "Querías calmar algo que se activó dentro.",
  "Por eso resistir no fue suficiente.",
  "Estabas intentando controlar el dedo… mientras la herida seguía empujando desde adentro.",
  "Veyra puede mostrarte el patrón.",
  "Pero ahora necesitas una guía real para ordenarlo.",
]

const ROUTES: Record<PatternKey, string[]> = {
  A: [
    "Lo que se activó no fue solo amor.",
    "Fue miedo.",
    "Miedo a que el silencio signifique final.",
    "Miedo a que su distancia confirme que ya no importas.",
    "Miedo a ser reemplazada, olvidada o dejada atrás.",
    "Cuando este patrón despierta, tu mente busca una señal: un visto, una respuesta, una reacción, algo que diga: “todavía existo para él”.",
    "Pero escribir desde abandono no siempre te acerca a la verdad.",
    "A veces solo te ata más a la espera.",
    "No necesitas perseguir una prueba de valor.",
    "Necesitas aprender a no abandonarte tú.",
    "Veyra reveló el miedo.",
    "Janny puede ayudarte a ordenarlo.",
  ],
  B: [
    "Tu impulso no busca solo conversación.",
    "Busca confirmación.",
    "Quiere saber si todavía importas.",
    "Si todavía piensa en ti.",
    "Si todavía te desea.",
    "Si todavía hay algo en él que te elige.",
    "Por eso escribir parece urgente.",
    "Porque una parte de ti cree que una respuesta puede devolverte valor.",
    "Pero tu valor no puede depender de que alguien conteste.",
    "Cuando escribes desde este patrón, no buscas palabras. Buscas verte a través de sus ojos.",
    "Veyra reveló la necesidad.",
    "Janny puede ayudarte a volver a tu centro.",
  ],
  C: [
    "Tu impulso nace de una pregunta abierta.",
    "Quieres entender.",
    "Quieres que algo encaje.",
    "Quieres que alguien diga lo que no supo decir cuando dolía.",
    "Este patrón te hace creer que una explicación te devolverá paz.",
    "Pero a veces el cierre no llega desde la persona que también fue parte de la confusión.",
    "No estás mal por querer respuestas.",
    "Pero necesitas cuidar desde dónde las buscas.",
    "Porque escribir desde desesperación por cierre puede abrir otra herida.",
    "Veyra reveló la búsqueda.",
    "Janny puede ayudarte a ordenar lo que quedó abierto.",
  ],
  D: [
    "Tu impulso no dice solamente “lo amo”.",
    "Dice: “quizá fui mala por alejarme”.",
    "Este patrón aparece cuando confundes cuidarte con abandonar.",
    "Cuando poner distancia te hace sentir fría.",
    "Cuando elegirte despierta culpa.",
    "Entonces quieres escribir para suavizar, explicar o demostrar que no eres mala.",
    "Pero una mujer no se vuelve mala por dejar de insistir donde se rompió algo importante.",
    "A veces tu paz empieza cuando puedes sostener la culpa sin convertirla en mensaje.",
    "Veyra reveló la culpa.",
    "Janny puede ayudarte a elegirte sin castigarte.",
  ],
  E: [
    "Tu impulso está mirando hacia atrás.",
    "Recuerda lo bonito.",
    "El inicio. Las palabras. Los momentos donde todo parecía posible.",
    "Y cuando la nostalgia se activa, tu mente empieza a suavizar lo que dolió.",
    "“Tal vez no fue tan grave.” “Tal vez exageré.” “Tal vez todavía hay algo.”",
    "Pero recordar lo bueno no borra lo que te hirió.",
    "No necesitas odiarlo para no escribirle.",
    "Necesitas recordarte completa.",
    "Veyra reveló la nostalgia.",
    "Janny puede ayudarte a mirar tu historia sin perderte en ella.",
  ],
  F: [
    "Tu cuerpo está pidiendo alivio.",
    "No necesariamente una relación.",
    "No necesariamente una conversación real.",
    "No necesariamente una decisión definitiva.",
    "Alivio.",
    "Por eso el impulso se siente tan fuerte.",
    "Porque no nace solo de una idea. Nace de una activación emocional en tu cuerpo.",
    "Quieres hacer algo para que pare: escribir, revisar, mirar si está en línea, buscar señales.",
    "Pero si escribes solo para calmar la ansiedad, la calma dura poco… y después vuelve la espera.",
    "Veyra reveló la activación.",
    "Janny puede ayudarte a sostenerla sin obedecerla.",
  ],
}

export function Exp5Reading({
  pattern,
  onComplete,
}: {
  pattern: PatternKey
  onComplete: () => void
}) {
  const [showRoute, setShowRoute] = useState(false)
  const info = PATTERNS[pattern]

  useEffect(() => {
    const t = setTimeout(() => setShowRoute(true), 1800)
    return () => clearTimeout(t)
  }, [])

  return (
    <section className="relative min-h-screen px-5 py-10">
      <Particles count={16} />
      <div className="relative z-10 mx-auto w-full max-w-md">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <VeyraOrb size={96} active />
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Lectura privada
          </p>
        </div>

        {/* General reading */}
        <div className="mb-6 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
          <h2 className="mb-4 font-serif text-xl text-gold">
            Lectura general de entrada
          </h2>
          <div className="space-y-2 leading-relaxed text-muted-foreground">
            {GENERAL.map((line, i) => (
              <p key={i} className="break-words">
                {line}
              </p>
            ))}
          </div>
        </div>

        {/* Route reveal */}
        {showRoute && (
          <div className="animate-float-up">
            <div className="mb-6 rounded-2xl border border-primary/40 bg-primary/10 p-5 text-center backdrop-blur">
              <p className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
                Tu patrón activo
              </p>
              <p className="mt-1 font-serif text-2xl text-gold break-words">
                {info.title}
              </p>
            </div>

            <div className="mb-8 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
              <div className="space-y-3 leading-relaxed">
                {ROUTES[pattern].map((line, i) => {
                  const isJanny = line.startsWith("Janny") || line.startsWith("Veyra reveló")
                  return (
                    <p
                      key={i}
                      className={`break-words ${
                        isJanny ? "font-serif text-base text-gold" : "text-foreground/90"
                      }`}
                    >
                      {line}
                    </p>
                  )
                })}
              </div>
            </div>

            <button
              onClick={onComplete}
              className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
            >
              Entrar al portal de Janny
              <ArrowRight className="size-5" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
