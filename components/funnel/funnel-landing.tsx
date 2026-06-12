"use client"

import { Volume2 } from "lucide-react"

export function FunnelLanding({ onStart }: { onStart: () => void }) {
  return (
    <section className="relative flex min-h-screen w-full flex-col items-center justify-center px-6 text-center">
      <div className="animate-float-up flex max-w-sm flex-col items-center">
        <p className="font-sans text-xs uppercase tracking-[0.45em] text-muted-foreground">
          GranDiosa Mujer
        </p>

        <h1 className="mt-8 text-balance font-serif text-4xl font-medium leading-tight text-foreground sm:text-5xl">
          Mujer,
          <span className="block text-gold text-glow">no le escribas.</span>
        </h1>

        <p className="mt-6 text-pretty font-sans text-sm leading-relaxed text-muted-foreground">
          Antes de escribirle desde la ansiedad, hay algo que necesitas escuchar.
          Activa el sonido y respira.
        </p>

        <button
          type="button"
          onClick={onStart}
          className="glow-violet mt-12 flex items-center gap-3 rounded-full bg-primary px-8 py-4 font-sans text-sm font-semibold uppercase tracking-wider text-primary-foreground transition-transform active:scale-95"
        >
          <Volume2 className="h-5 w-5" strokeWidth={2} />
          Activar sonido y comenzar
        </button>

        <p className="mt-6 font-sans text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground/70">
          Usa audífonos para una mejor experiencia
        </p>
      </div>
    </section>
  )
}
