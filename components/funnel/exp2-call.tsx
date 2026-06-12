"use client"

import { useEffect, useState } from "react"
import { Phone, PhoneOff, Mic, MicOff, Volume2 } from "lucide-react"
import { VeyraOrb } from "./veyra-orb"
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
      <Particles count={20} />

      {/* Header / name */}
      <div className="relative z-10 mt-6 flex flex-col items-center gap-2">
        <span className="text-xs uppercase tracking-[0.35em] text-muted-foreground">
          {state === "incoming"
            ? "Llamada entrante"
            : state === "ending"
              ? "Finalizando"
              : "En llamada"}
        </span>
        <h1 className="font-serif text-5xl tracking-wide text-gold">VEYRA</h1>
        {state === "active" && (
          <span className="font-mono text-sm text-muted-foreground">
            {fmt(timer)}
          </span>
        )}
      </div>

      {/* Orb */}
      <div className="relative z-10 flex flex-col items-center gap-8">
        <div className={state === "incoming" ? "animate-ring-vibrate" : ""}>
          <VeyraOrb size={200} active />
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
          <div className="flex items-center justify-around">
            <button
              onClick={endCall}
              aria-label="Rechazar llamada"
              className="flex size-16 items-center justify-center rounded-full bg-destructive text-white shadow-lg transition-transform active:scale-90"
            >
              <PhoneOff className="size-7" />
            </button>
            <button
              onClick={() => setState("active")}
              aria-label="Aceptar llamada"
              className="flex size-16 items-center justify-center rounded-full bg-emerald-500 text-white glow-violet animate-mystic-pulse transition-transform active:scale-90"
            >
              <Phone className="size-7" />
            </button>
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
