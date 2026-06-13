"use client"

import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import type { PatternKey } from "./types"
import { PATTERNS } from "./types"
import { VeyraOrb } from "./veyra-orb"
import { Particles } from "./particles"

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

const RESULT_TIMINGS = [
  { at: 3000, layer: 1 },
  { at: 6500, layer: 2 },
  { at: 12000, layer: 3 },
  { at: 17500, layer: 4 },
  { at: 23000, layer: 5 },
]

function getRouteLayers(pattern: PatternKey) {
  const route = ROUTES[pattern]

  switch (pattern) {
    case "A":
      return {
        hit: route[1],
        reading: route.slice(2, 4),
        direction: route.slice(-2),
      }
    case "B":
      return {
        hit: route[1],
        reading: [route[2], route[7]],
        direction: route.slice(-2),
      }
    case "C":
      return {
        hit: route[0],
        reading: [route[1], route[4]],
        direction: route.slice(-2),
      }
    case "D":
      return {
        hit: route[2],
        reading: [route[3], route[7]],
        direction: route.slice(-2),
      }
    case "E":
      return {
        hit: route[0],
        reading: [route[1], route[5]],
        direction: route.slice(-2),
      }
    case "F":
      return {
        hit: route[0],
        reading: [route[4], route[5]],
        direction: route.slice(-2),
      }
  }
}

export function Exp5Reading({
  pattern,
  onComplete,
}: {
  pattern: PatternKey
  onComplete: () => void
}) {
  const [layer, setLayer] = useState(0)
  const info = PATTERNS[pattern]
  const routeLayers = getRouteLayers(pattern)

  useEffect(() => {
    setLayer(0)
    const timers = RESULT_TIMINGS.map(({ at, layer: nextLayer }) =>
      window.setTimeout(() => setLayer(nextLayer), at),
    )

    return () => {
      timers.forEach((timer) => window.clearTimeout(timer))
    }
  }, [])

  return (
    <section className="access-chamber relative min-h-screen overflow-hidden px-5 py-10">
      <Particles count={22} />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_18%,oklch(0.36_0.15_304/.34),transparent_32%),radial-gradient(circle_at_50%_78%,oklch(0.72_0.12_86/.10),transparent_34%),linear-gradient(180deg,oklch(0.06_0.03_292),oklch(0.12_0.07_300)_48%,oklch(0.05_0.02_292))]" />
      <div className="pointer-events-none absolute -top-24 left-1/2 size-[340px] -translate-x-1/2 rounded-full border border-gold/10 blur-[1px] access-portal" />
      <div className="relative z-10 mx-auto w-full max-w-[460px]">
        {/* Header */}
        <div className="mb-8 flex flex-col items-center gap-3 text-center">
          <VeyraOrb size={96} active />
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Lectura privada
          </p>
        </div>

        <div className="rounded-2xl border border-gold/20 bg-[linear-gradient(180deg,oklch(0.16_0.07_298/.78),oklch(0.09_0.04_292/.74))] p-6 shadow-[0_0_32px_oklch(0.45_0.18_304/.22),inset_0_0_28px_oklch(0.82_0.12_86/.06)] backdrop-blur">
          <div className="min-h-[470px] space-y-8 text-center">
            <div className="animate-float-up">
              <p className="text-xs uppercase tracking-[0.32em] text-gold/80">
                RUTA DETECTADA
              </p>
            </div>

            {layer >= 1 && (
              <div className="animate-float-up">
                <p className="font-serif text-3xl leading-tight text-gold text-balance break-words">
                  {info.title}
                </p>
              </div>
            )}

            {layer >= 2 && (
              <div className="animate-float-up">
                <p className="mx-auto max-w-xs font-serif text-2xl leading-relaxed text-[#f5eedc] text-balance break-words">
                  {routeLayers.hit}
                </p>
              </div>
            )}

            {layer >= 3 && (
              <div className="animate-float-up space-y-3 text-left">
                {routeLayers.reading.map((line) => (
                  <p
                    key={line}
                    className="text-pretty text-base leading-relaxed text-foreground/90 break-words"
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}

            {layer >= 4 && (
              <div className="animate-float-up space-y-3 border-t border-gold/15 pt-6">
                {routeLayers.direction.map((line) => (
                  <p
                    key={line}
                    className="font-serif text-lg leading-relaxed text-gold text-balance break-words"
                  >
                    {line}
                  </p>
                ))}
              </div>
            )}
          </div>
        </div>

        {layer >= 5 && (
          <button
            onClick={onComplete}
            className="animate-float-up mt-8 flex w-full items-center justify-center gap-2 rounded-full border border-gold/70 bg-[linear-gradient(135deg,oklch(0.33_0.16_302/.96),oklch(0.18_0.08_295/.96))] py-4 font-medium uppercase tracking-wide text-gold glow-violet transition-transform active:scale-95"
          >
            ABRIR EL CAMINO HACIA JANNY
            <ArrowRight className="size-5" />
          </button>
        )}
      </div>
    </section>
  )
}
