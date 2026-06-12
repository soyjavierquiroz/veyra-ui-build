"use client"

import Image from "next/image"
import {
  Check,
  Sparkles,
  ShieldCheck,
  MessageCircleQuestion,
} from "lucide-react"
import { funnelConfig } from "./config"
import { Particles } from "./particles"

const INCLUDES = [
  "Recorrido guiado de 7 días.",
  "Método P.A.U.S.A. aplicado al impulso de escribirle.",
  "Prácticas para pausar antes de abrir el chat.",
  "Ejercicios para nombrar lo que sientes.",
  "Guía para separar hechos de fantasías.",
  "Descarga emocional sin enviar el mensaje.",
  "Material de apoyo tipo kit.",
  "Acceso digital.",
  "Soporte operativo por WhatsApp para pago y acceso.",
  "Garantía de claridad emocional de 7 días.",
]

export function Exp10Offer({
  onPrimary,
  onSecondary,
}: {
  onPrimary: () => void
  onSecondary: () => void
}) {
  return (
    <section className="relative min-h-screen pb-28">
      <Particles count={14} />
      <div className="relative z-10 mx-auto w-full max-w-md px-5 py-12">
        {/* Hero */}
        <div className="mb-10 text-center">
          <span className="mb-4 inline-flex items-center gap-1.5 rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-xs uppercase tracking-wide text-gold">
            <Sparkles className="size-3.5" />
            Acceso especial de lanzamiento
          </span>
          <h1 className="text-balance font-serif text-3xl leading-tight text-gold">
            Antes de escribirle desde ansiedad, haz una P.A.U.S.A. y vuelve a ti.
          </h1>
          <p className="mt-4 text-pretty leading-relaxed text-muted-foreground break-words">
            Entra a <strong className="text-foreground">Mujer, No Le Escribas</strong> — Reto 7
            Días para Volver a Ti, el primer portal del Método P.A.U.S.A. dentro de GranDiosa
            Mujer. Creado para ayudarte a pausar, ordenar lo que sientes y decidir desde más
            calma antes de actuar desde ansiedad, nostalgia, culpa o necesidad de respuesta.
          </p>
        </div>

        {/* Value block */}
        <div className="mb-8 rounded-2xl border border-border bg-card/60 p-6 backdrop-blur">
          <p className="leading-relaxed text-foreground/90 break-words">
            Este reto no está aquí para juzgarte. No está aquí para decirte “supéralo ya”. No
            está aquí para obligarte a dejar de sentir. Está aquí para acompañarte durante 7
            días en el momento más delicado: cuando una parte de ti quiere volver al chat… pero
            otra parte sabe que necesita volver a sí misma.
          </p>
        </div>

        {/* Janny block */}
        <div className="mb-8 flex flex-col items-center gap-4 rounded-2xl border border-gold/30 bg-card/60 p-6 text-center backdrop-blur">
          <div className="relative size-24 overflow-hidden rounded-full border border-gold/40 glow-gold">
            <Image
              src="/janny-portrait.png"
              alt="Janny Helguero"
              fill
              className="object-cover"
            />
          </div>
          <div>
            <p className="font-serif text-xl text-gold">Janny Helguero</p>
            <p className="text-sm text-muted-foreground">Fundadora de GranDiosa Mujer.</p>
          </div>
          <p className="text-sm leading-relaxed text-foreground/90 break-words">
            Más de 25 años acompañando procesos emocionales de mujeres. Veyra reveló el patrón.
            Janny te acompaña a ordenarlo. Este reto no es terapia. No es una promesa mágica. No
            es “olvídalo en 7 días”. Es una experiencia guiada para que empieces a volver a ti
            cuando el impulso quiere decidir por ti.
          </p>
        </div>

        {/* Includes */}
        <div className="mb-8">
          <h2 className="mb-4 font-serif text-2xl text-gold">Qué incluye</h2>
          <p className="mb-3 text-sm text-muted-foreground">Dentro del reto recibes:</p>
          <ul className="flex flex-col gap-3">
            {INCLUDES.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <Check className="mt-0.5 size-5 shrink-0 text-gold" />
                <span className="text-sm leading-relaxed text-foreground/90 break-words">
                  {item}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Value phrase */}
        <div className="mb-8 rounded-2xl border border-primary/40 bg-primary/10 p-6 text-center backdrop-blur">
          <p className="font-serif text-xl text-foreground text-balance">
            No es solo un PDF.
          </p>
          <p className="mt-1 leading-relaxed text-muted-foreground break-words">
            Es un kit guiado para volver a ti antes de enviar un mensaje desde ansiedad.
          </p>
        </div>

        {/* Price */}
        <div className="mb-8 flex flex-col items-center gap-1 rounded-2xl border border-gold/40 bg-card/70 p-6 text-center glow-gold backdrop-blur">
          <span className="text-xs uppercase tracking-[0.25em] text-muted-foreground">
            Acceso especial de lanzamiento
          </span>
          <span className="font-serif text-5xl text-gold">
            {funnelConfig.priceLabel}
          </span>
        </div>

        {/* Guarantee mini */}
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-border bg-card/50 p-4">
          <ShieldCheck className="size-7 shrink-0 text-gold" />
          <p className="text-sm text-foreground/90 break-words">
            Garantía de claridad emocional de 7 días.
          </p>
        </div>
      </div>

      {/* Sticky CTA */}
      <div className="fixed bottom-0 left-0 right-0 z-30 border-t border-border bg-background/90 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex w-full max-w-md flex-col gap-2">
          <button
            onClick={onPrimary}
            className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 text-sm font-semibold uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
          >
            Quiero empezar mi P.A.U.S.A. — {funnelConfig.priceLabel}
          </button>
          <button
            onClick={onSecondary}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-secondary/60 py-3 text-sm font-medium text-foreground transition-transform active:scale-95"
          >
            <MessageCircleQuestion className="size-4" />
            Tengo una duda por WhatsApp
          </button>
        </div>
      </div>
    </section>
  )
}
