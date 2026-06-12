"use client"

import { useEffect, useState } from "react"
import Image from "next/image"
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react"
import { Particles } from "./particles"

type CallState = "incoming" | "active" | "ending"

function fmt(s: number) {
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`
}

export function Exp2Call({ onComplete }: { onComplete: () => void }) {
  const [state, setState] = useState<CallState>("incoming")
  const [timer, setTimer] = useState(0)
  const [muted, setMuted] = useState(false)
  const [speaker, setSpeaker] = useState(false)

  useEffect(() => {
    if (state !== "active") return
    const id = setInterval(() => {
      setTimer((t) => {
        if (t >= 14) {
          clearInterval(id)
          setState("ending")
          setTimeout(onComplete, 1200)
          return t
        }
        return t + 1
      })
    }, 1000)
    return () => clearInterval(id)
  }, [state, onComplete])

  const endCall = () => {
    setState("ending")
    setTimeout(onComplete, 1000)
  }

  return (
    <section className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden px-6 py-12">
      {/* Cinematic full-screen background */}
      <div className="absolute inset-0 -z-10">
        <Image
          src="/veyra-perfil.webp"
          alt=""
          fill
          priority
          aria-hidden="true"
          className="scale-110 object-cover blur-2xl"
        />
        <div className="absolute inset-0 bg-background/80" />
        <div className="absolute inset-0 bg-[radial-gradient(70%_55%_at_50%_38%,oklch(0.32_0.12_300_/_0.45),transparent_70%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-transparent to-background" />
      </div>
      <Particles count={18} />

      {/* Brand mark */}
      <div className="relative z-10 mt-2 self-start">
        <span className="text-[0.65rem] uppercase tracking-[0.4em] text-muted-foreground">
          GranDiosa Mujer
        </span>
      </div>

      {/* Avatar + identity */}
      <div className="relative z-10 flex flex-1 flex-col items-center justify-center gap-7">
        <div className="relative">
          {/* Glowing rotating ring */}
          <div
            className={`absolute -inset-3 rounded-full ${state === "incoming" ? "animate-halo-spin" : ""}`}
            style={{
              background:
                "conic-gradient(from 0deg, transparent, var(--gold), transparent 30%, transparent 60%, var(--primary), transparent)",
              opacity: 0.85,
            }}
            aria-hidden="true"
          />
          <div
            className={`relative overflow-hidden rounded-full border-2 border-gold/60 glow-violet ${
              state === "incoming" ? "animate-mystic-pulse" : ""
            }`}
            style={{ width: 168, height: 168 }}
          >
            <Image
              src="/veyra-perfil.webp"
              alt="Veyra"
              fill
              priority
              className="object-cover"
            />
          </div>
        </div>

        <div className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-serif text-5xl tracking-wide text-gold text-glow">
            VEYRA
          </h1>
          <p className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
            Guardiana del Método P.A.U.S.A.
          </p>
          <span
            className={`mt-3 text-sm uppercase tracking-[0.3em] ${
              state === "active"
                ? "font-mono text-primary"
                : "text-gold animate-soft-blink"
            }`}
          >
            {state === "incoming"
              ? "Llamada entrante…"
              : state === "ending"
                ? "Finalizando…"
                : fmt(timer)}
          </span>
        </div>

        {state === "active" && (
          <div className="flex items-end gap-1.5" aria-hidden="true">
            {Array.from({ length: 18 }).map((_, i) => (
              <span
                key={i}
                className="w-1 rounded-full bg-primary/80"
                style={{
                  height: 8 + Math.abs(Math.sin(i + timer)) * 30,
                  animation: `mystic-pulse ${0.8 + (i % 5) * 0.15}s ease-in-out ${i * 0.05}s infinite`,
                }}
              />
            ))}
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="relative z-10 mb-6 w-full max-w-xs">
        {state === "incoming" ? (
          <div className="flex flex-col items-center gap-4">
            <button
              onClick={() => setState("active")}
              aria-label="Contestar llamada"
              className="flex size-[72px] items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg glow-violet animate-mystic-pulse transition-transform active:scale-90"
            >
              <Phone className="size-8" />
            </button>
            <span className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
              Desliza para contestar
            </span>
          </div>
        ) : (
          <div className="flex items-center justify-around">
            <button
              onClick={() => setMuted((m) => !m)}
              aria-label="Silenciar"
              aria-pressed={muted}
              className="flex size-14 items-center justify-center rounded-full bg-secondary text-secondary-foreground transition-transform active:scale-90"
            >
              {muted ? <MicOff className="size-6" /> : <Mic className="size-6" />}
            </button>
            <button
              onClick={endCall}
              aria-label="Finalizar llamada"
              className="flex size-16 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition-transform active:scale-90"
            >
              <PhoneOff className="size-7" />
            </button>
            <button
              onClick={() => setSpeaker((s) => !s)}
              aria-label="Altavoz"
              aria-pressed={speaker}
              className={`flex size-14 items-center justify-center rounded-full transition-transform active:scale-90 ${
                speaker
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              <Volume2 className="size-6" />
            </button>
          </div>
        )}
      </div>
    </section>
  )
}
