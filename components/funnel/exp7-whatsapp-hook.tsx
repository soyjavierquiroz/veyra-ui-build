"use client"

import { useEffect, useState } from "react"
import { ArrowRight } from "lucide-react"
import { WhatsappFrame, Bubble, Typing } from "./whatsapp-ui"

const BLOCKS = [
  "Hola, hermosa.",
  "Tu portal privado ya está listo.",
  "Para entrar al Feed Secreto de Veyra usa esta contraseña:\n\nPAUSA7\n\nEscríbela exactamente así en la siguiente pantalla.",
  "Mira los 3 mensajes en orden.\nEl último te mostrará cómo empezar tu P.A.U.S.A.",
]

export function Exp7WhatsappHook({ onComplete }: { onComplete: () => void }) {
  const [shown, setShown] = useState(0)
  const [typing, setTyping] = useState(true)

  useEffect(() => {
    if (shown >= BLOCKS.length) {
      setTyping(false)
      return
    }
    setTyping(true)
    const typeT = setTimeout(() => {
      setTyping(false)
      setShown((s) => s + 1)
    }, 1200)
    return () => clearTimeout(typeT)
  }, [shown])

  const done = shown >= BLOCKS.length && !typing

  return (
    <WhatsappFrame
      footer={
        done ? (
          <button
            onClick={onComplete}
            className="animate-float-up flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
          >
            Entrar al feed secreto
            <ArrowRight className="size-5" />
          </button>
        ) : null
      }
    >
      {BLOCKS.slice(0, shown).map((b, i) => (
        <Bubble key={i} side="in">
          {b}
        </Bubble>
      ))}
      {typing && shown < BLOCKS.length && <Typing />}
    </WhatsappFrame>
  )
}
