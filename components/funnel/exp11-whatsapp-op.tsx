"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import { QrCode, Link2, Send, FileCheck2 } from "lucide-react"
import { WhatsappFrame, Bubble, Typing } from "./whatsapp-ui"

export type OpEntry = "buy" | "doubt"

type Msg =
  | { id: string; kind: "in"; text: string }
  | { id: string; kind: "out"; text: string }
  | { id: string; kind: "qr" }
  | { id: string; kind: "link" }

let idc = 0
const uid = () => `m${idc++}`

const SEQ = {
  A: [
    "Hola, hermosa.",
    "Estás a un paso de activar tu acceso al reto Mujer, No Le Escribas — 7 Días para Volver a Ti.",
    "El acceso especial de lanzamiento es de Bs 69.",
    "Puedes realizar el pago mediante QR.",
    "Te lo envío ahora.",
  ],
  B: [
    "Aquí tienes tu QR.",
    "Monto: Bs 69",
    "Concepto: Reto Mujer, No Le Escribas",
    "Cuando tengas el comprobante, mándalo por este chat.",
    "Estamos aquí para ayudarte con el acceso.",
  ],
  C: [
    "Recibido, hermosa.",
    "Estamos validando tu comprobante.",
    "Gracias por dar este paso con tanta honestidad.",
    "No estás entrando a un espacio para juzgarte.",
    "Estás entrando a un proceso para volver a ti.",
  ],
  D: [
    "Pago confirmado.",
    "Tu acceso al reto ya está activado.",
    "Aquí tienes tu enlace de ingreso:",
  ],
  Dtail: [
    "Guarda este mensaje.",
    "Recomendación: empieza el Día 1 antes de volver a abrir ese chat.",
    "Hazlo con calma.",
    "Una pausa puede cambiar desde dónde decides.",
  ],
  E: [
    "También puedes entrar.",
    "El reto no es solo para evitar un mensaje.",
    "Es para entender qué se activó antes, durante o después de escribir.",
    "Si ya pasó, no te castigues.",
    "Empieza desde ahí.",
    "Volver a ti también puede comenzar después de una recaída emocional.",
  ],
  F: [
    "No, hermosa.",
    "Este reto no reemplaza terapia ni atención profesional.",
    "Es un recorrido de claridad emocional y pausa guiada.",
    "Si estás en una crisis intensa, con pensamientos de hacerte daño o sientes que no puedes sostenerte, busca apoyo profesional o ayuda inmediata en tu zona.",
    "El reto puede acompañarte, pero no sustituye ayuda clínica cuando se necesita.",
  ],
  G: [
    "Incluye un recorrido guiado de 7 días.",
    "Está basado en el Método P.A.U.S.A.",
    "No es solo un PDF.",
    "Es un kit guiado con prácticas para pausar antes de abrir el chat, nombrar lo que sientes, separar hechos de fantasías y descargar sin enviar.",
    "El objetivo es que tengas más claridad antes de actuar desde ansiedad.",
  ],
  H: [
    "Realizas el pago por QR.",
    "Nos envías el comprobante por aquí.",
    "Validamos el pago.",
    "Te enviamos el enlace de acceso al reto.",
    "Todo queda en este mismo WhatsApp.",
  ],
}

const QUICK = [
  { id: "E", label: "¿Y si ya le escribí?" },
  { id: "F", label: "¿Esto reemplaza terapia?" },
  { id: "G", label: "¿Qué incluye?" },
  { id: "H", label: "¿Cómo accedo?" },
] as const

function QrCard() {
  return (
    <div className="flex justify-start animate-float-up">
      <div className="max-w-[80%] rounded-2xl rounded-tl-sm bg-[oklch(0.22_0.04_295)] p-3">
        <div className="flex aspect-square w-44 items-center justify-center rounded-xl bg-white p-3">
          <div
            className="size-full"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg,#000 0 8px,#fff 8px 16px), repeating-linear-gradient(90deg,#000 0 8px,transparent 8px 16px)",
              backgroundBlendMode: "multiply",
            }}
            aria-label="Código QR de pago"
            role="img"
          />
        </div>
        <p className="mt-2 text-center text-xs text-foreground/70">
          Monto: Bs 69 · Reto Mujer, No Le Escribas
        </p>
      </div>
    </div>
  )
}

function LinkCard() {
  return (
    <div className="flex justify-start animate-float-up">
      <div className="flex max-w-[80%] items-center gap-2 rounded-2xl rounded-tl-sm border border-gold/40 bg-[oklch(0.22_0.04_295)] px-3.5 py-3">
        <Link2 className="size-5 shrink-0 text-gold" />
        <span className="break-all font-mono text-sm text-gold">
          [ENLACE DE ACCESO]
        </span>
      </div>
    </div>
  )
}

export function Exp11WhatsappOp({ entry }: { entry: OpEntry }) {
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [stage, setStage] = useState<"intro" | "qr-sent" | "validating" | "done">(
    "intro",
  )
  const [usedQuick, setUsedQuick] = useState<Record<string, boolean>>({})
  const queue = useRef<Promise<void>>(Promise.resolve())
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [msgs, typing])

  const pushBot = useCallback((lines: (Msg | string)[]) => {
    queue.current = queue.current.then(
      () =>
        new Promise<void>((resolve) => {
          let i = 0
          const run = () => {
            if (i >= lines.length) {
              resolve()
              return
            }
            setTyping(true)
            setTimeout(() => {
              setTyping(false)
              const item = lines[i]
              const msg: Msg =
                typeof item === "string"
                  ? { id: uid(), kind: "in", text: item }
                  : item
              setMsgs((m) => [...m, msg])
              i++
              setTimeout(run, 250)
            }, 750)
          }
          run()
        }),
    )
  }, [])

  // initial sequence
  useEffect(() => {
    if (entry === "buy") {
      pushBot(SEQ.A)
      pushBot([{ id: uid(), kind: "qr" }, ...SEQ.B])
      // after QR shown, ask for comprobante step handled by buttons
      queue.current.then(() => setStage("qr-sent"))
    } else {
      pushBot([
        "Hola, hermosa.",
        "Estamos aquí para ayudarte con cualquier duda antes de entrar al reto.",
        "Puedes tocar una de estas preguntas:",
      ])
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const sendComprobante = () => {
    setMsgs((m) => [...m, { id: uid(), kind: "out", text: "📄 Comprobante de pago" }])
    setStage("validating")
    pushBot(SEQ.C)
    queue.current.then(() => {
      // simulate validation delay then confirm
      setTimeout(() => {
        pushBot(SEQ.D)
        pushBot([{ id: uid(), kind: "link" }, ...SEQ.Dtail])
        queue.current.then(() => setStage("done"))
      }, 1200)
    })
  }

  const askQuick = (q: (typeof QUICK)[number]) => {
    if (usedQuick[q.id]) return
    setUsedQuick((s) => ({ ...s, [q.id]: true }))
    setMsgs((m) => [...m, { id: uid(), kind: "out", text: q.label }])
    pushBot(SEQ[q.id as "E" | "F" | "G" | "H"])
  }

  const footer = (
    <div className="flex flex-col gap-2">
      {/* primary action depending on stage */}
      {entry === "buy" && stage === "qr-sent" && (
        <button
          onClick={sendComprobante}
          className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
        >
          <FileCheck2 className="size-5" />
          Enviar comprobante
        </button>
      )}
      {stage === "done" && (
        <div className="rounded-xl border border-gold/40 bg-gold/10 p-3 text-center text-sm text-gold break-words">
          Acceso confirmado. Guarda tu enlace de ingreso.
        </div>
      )}

      {/* quick questions */}
      <div className="flex flex-wrap gap-2">
        {QUICK.map((q) => (
          <button
            key={q.id}
            onClick={() => askQuick(q)}
            disabled={usedQuick[q.id]}
            className="rounded-full border border-primary/40 bg-secondary/60 px-3 py-1.5 text-xs text-foreground transition-colors disabled:opacity-40 enabled:active:scale-95"
          >
            {q.label}
          </button>
        ))}
      </div>

      {/* fake input row */}
      <div className="flex items-center gap-2 rounded-full bg-[oklch(0.22_0.04_295)] px-4 py-2.5">
        <QrCode className="size-4 text-foreground/40" />
        <span className="flex-1 text-sm text-foreground/40">Mensaje</span>
        <Send className="size-4 text-foreground/40" />
      </div>
    </div>
  )

  return (
    <WhatsappFrame footer={footer}>
      {msgs.map((m) => {
        if (m.kind === "qr") return <QrCard key={m.id} />
        if (m.kind === "link") return <LinkCard key={m.id} />
        return (
          <Bubble key={m.id} side={m.kind}>
            {m.text}
          </Bubble>
        )
      })}
      {typing && <Typing />}
      <div ref={endRef} />
    </WhatsappFrame>
  )
}
