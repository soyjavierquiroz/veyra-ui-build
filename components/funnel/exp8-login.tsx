"use client"

import { useEffect, useState } from "react"
import { Lock, ArrowRight, RotateCcw, Check } from "lucide-react"
import { Particles } from "./particles"

type Phase = "input" | "error" | "unlocking" | "success"

const UNLOCK_STEPS = [
  "Contraseña aceptada.",
  "PAUSA activada.",
  "Feed Secreto desbloqueado.",
  "Mira los 3 mensajes en orden.",
]

export function Exp8Login({ onComplete }: { onComplete: () => void }) {
  const [value, setValue] = useState("")
  const [phase, setPhase] = useState<Phase>("input")
  const [step, setStep] = useState(0)

  useEffect(() => {
    if (phase !== "unlocking") return
    const id = setInterval(() => {
      setStep((s) => {
        if (s >= UNLOCK_STEPS.length - 1) {
          clearInterval(id)
          setPhase("success")
          return s
        }
        return s + 1
      })
    }, 700)
    return () => clearInterval(id)
  }, [phase])

  const submit = () => {
    if (value.trim().toUpperCase() === "PAUSA7") {
      setPhase("unlocking")
      setStep(0)
    } else {
      setPhase("error")
    }
  }

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-5 py-12">
      <Particles count={18} />
      <div className="relative z-10 w-full max-w-sm">
        <div className="rounded-3xl border border-border bg-card/70 p-7 backdrop-blur glow-violet">
          <div className="mb-6 flex flex-col items-center gap-3 text-center">
            <span className="flex size-14 items-center justify-center rounded-full border border-gold/50 text-gold glow-gold">
              <Lock className="size-6" />
            </span>
            <h1 className="font-serif text-2xl text-gold">Feed Secreto de Veyra</h1>
          </div>

          {phase === "unlocking" || phase === "success" ? (
            <div className="flex flex-col gap-3">
              {UNLOCK_STEPS.slice(0, step + 1).map((t, i) => (
                <p
                  key={i}
                  className="animate-float-up flex items-center gap-2 text-sm break-words"
                >
                  <Check className="size-4 shrink-0 text-emerald-400" />
                  <span
                    className={
                      i === 0 ? "font-serif text-base text-gold" : "text-foreground/90"
                    }
                  >
                    {t}
                  </span>
                </p>
              ))}
              {phase === "success" && (
                <button
                  onClick={onComplete}
                  className="animate-float-up mt-4 flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
                >
                  Entrar al feed
                  <ArrowRight className="size-5" />
                </button>
              )}
            </div>
          ) : (
            <>
              <p className="mb-1 text-center text-sm text-muted-foreground break-words">
                Este espacio no es público.
              </p>
              <p className="mb-1 text-center text-sm text-muted-foreground break-words">
                Aquí no vienes a mirar contenido común.
              </p>
              <p className="mb-1 text-center text-sm text-foreground break-words">
                Vienes a leer el patrón antes de repetirlo.
              </p>
              <p className="mb-5 text-center text-sm text-muted-foreground break-words">
                Ingresa la contraseña del portal.
              </p>

              <label className="mb-1.5 block text-xs uppercase tracking-wide text-muted-foreground">
                Contraseña
              </label>
              <input
                value={value}
                onChange={(e) => {
                  setValue(e.target.value)
                  if (phase === "error") setPhase("input")
                }}
                onKeyDown={(e) => e.key === "Enter" && submit()}
                placeholder="PAUSA7"
                aria-label="Contraseña"
                className="mb-4 w-full rounded-xl border border-border bg-input/40 px-4 py-3 text-center font-mono tracking-[0.3em] text-foreground placeholder:text-muted-foreground/50 focus:border-primary focus:outline-none"
              />

              {phase === "error" && (
                <div className="mb-4 animate-float-up rounded-xl border border-destructive/40 bg-destructive/15 p-3 text-center text-sm">
                  <p className="break-words text-foreground">
                    La contraseña no abrió el portal.
                  </p>
                  <p className="break-words text-muted-foreground">
                    Revisa que esté escrita exactamente así:
                  </p>
                  <p className="mt-1 font-mono tracking-[0.2em] text-gold">PAUSA7</p>
                </div>
              )}

              <button
                onClick={submit}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
              >
                {phase === "error" ? (
                  <>
                    <RotateCcw className="size-5" />
                    Intentar de nuevo
                  </>
                ) : (
                  "Abrir feed"
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
