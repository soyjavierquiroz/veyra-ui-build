"use client"

import { useEffect, useRef, useState } from "react"
import { ScanLine, Sparkles } from "lucide-react"
import { Particles } from "./particles"

type Line = { at: number; text: string; kind?: "muted" | "result" | "chips" }

const SCRIPT: Line[] = [
  { at: 0, text: "Inicializando lectura emocional…", kind: "muted" },
  { at: 6, text: "Detectando impulso de contacto…", kind: "muted" },
  { at: 14, text: "Señal emocional encontrada." },
  { at: 22, text: "Analizando emoción dominante detrás del mensaje…", kind: "muted" },
  { at: 32, text: "Posibles patrones activos:" },
  { at: 38, text: "chips", kind: "chips" },
  { at: 52, text: "Separando impulso de identidad…", kind: "muted" },
  { at: 62, text: "Resultado parcial:", kind: "muted" },
  { at: 66, text: "No eres débil.", kind: "result" },
  { at: 72, text: "Algo en ti está buscando alivio.", kind: "result" },
  { at: 86, text: "Scanner finalizado." },
  { at: 92, text: "Responde para revelar tu patrón.", kind: "muted" },
]

const CHIPS = [
  "abandono",
  "validación",
  "culpa",
  "nostalgia",
  "cierre",
  "ansiedad por silencio",
]

export function Exp3Scanner({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id)
          return 100
        }
        return p + 1
      })
    }, 70)
    return () => clearInterval(id)
  }, [])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [progress])

  const done = progress >= 100
  const visible = SCRIPT.filter((l) => l.at <= progress)

  const bar = (pct: number) => {
    const filled = Math.round((pct / 100) * 10)
    return "[" + "█".repeat(filled) + "░".repeat(10 - filled) + "]"
  }

  return (
    <section className="relative flex min-h-screen flex-col items-center px-5 py-10">
      <Particles count={18} />
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          backgroundImage:
            "linear-gradient(oklch(0.7 0.16 300) 1px, transparent 1px), linear-gradient(90deg, oklch(0.7 0.16 300) 1px, transparent 1px)",
          backgroundSize: "32px 32px",
        }}
        aria-hidden="true"
      />

      <div className="relative z-10 flex w-full max-w-md flex-1 flex-col">
        <div className="mb-6 flex flex-col items-center gap-3 text-center">
          <ScanLine className="size-10 text-primary animate-soft-blink" />
          <h1 className="font-serif text-2xl text-gold">Scanner de herida activa</h1>
        </div>

        {/* Progress */}
        <div className="mb-2 flex items-center justify-between font-mono text-xs text-muted-foreground">
          <span>{bar(progress)}</span>
          <span>{progress}%</span>
        </div>
        <div className="mb-6 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full bg-gradient-to-r from-primary to-gold transition-[width] duration-100"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Terminal */}
        <div
          ref={scrollRef}
          className="min-h-[280px] flex-1 space-y-3 overflow-y-auto rounded-2xl border border-border bg-card/60 p-5 font-mono text-sm leading-relaxed backdrop-blur"
        >
          {visible.map((l, i) =>
            l.kind === "chips" ? (
              <div key={i} className="flex flex-wrap gap-2 py-1">
                {CHIPS.map((c) => (
                  <span
                    key={c}
                    className="animate-float-up rounded-full border border-primary/40 bg-primary/15 px-3 py-1 text-xs text-foreground break-words"
                  >
                    {c}
                  </span>
                ))}
              </div>
            ) : (
              <p
                key={i}
                className={`animate-float-up break-words ${
                  l.kind === "result"
                    ? "font-serif text-base text-gold"
                    : l.kind === "muted"
                      ? "text-muted-foreground"
                      : "text-foreground"
                }`}
              >
                {l.text}
              </p>
            ),
          )}
        </div>

        {/* CTA */}
        <div className="mt-6 min-h-[60px]">
          {done && (
            <button
              onClick={onComplete}
              className="animate-float-up flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
            >
              <Sparkles className="size-5" />
              Revelar mi patrón
            </button>
          )}
        </div>
      </div>
    </section>
  )
}
