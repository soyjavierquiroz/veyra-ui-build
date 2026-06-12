"use client"

import { useEffect, useState } from "react"
import {
  Heart,
  MessageCircle,
  Bookmark,
  Share2,
  ChevronUp,
  ArrowRight,
} from "lucide-react"
import { trackFunnelEvent } from "./lib/analytics"
import { VeyraOrb } from "./veyra-orb"

type Video = {
  title: string
  onScreen: string[]
  description: string
  hashtags: string[]
}

const VIDEOS: Video[] = [
  {
    title: "El impulso no es el mensaje",
    onScreen: ["El impulso no es el mensaje.", "Es una parte de ti pidiendo alivio."],
    description:
      "Antes de enviar ese mensaje, mira qué parte de ti está intentando hablar.",
    hashtags: [
      "#MujerNoLeEscribas",
      "#PausaAntesDeEscribir",
      "#VolverATi",
      "#GranDiosaMujer",
    ],
  },
  {
    title: "Por qué el contacto cero no fue suficiente",
    onScreen: [
      "No fallaste por falta de dignidad.",
      "Te faltó una estructura para sostener el impulso.",
    ],
    description:
      "El contacto cero puede cerrar una puerta afuera, pero no siempre ordena lo que grita adentro.",
    hashtags: ["#ContactoCero", "#AnsiedadAfectiva", "#VolverATi", "#MetodoPausa"],
  },
  {
    title: "Método P.A.U.S.A. + entrada al reto",
    onScreen: ["No necesitas resistir sola.", "Necesitas hacer una P.A.U.S.A."],
    description: "",
    hashtags: [],
  },
]

function SideButton({
  icon: Icon,
  label,
  active,
  count,
  onClick,
}: {
  icon: typeof Heart
  label: string
  active?: boolean
  count?: string
  onClick?: () => void
}) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      className="flex flex-col items-center gap-1 transition-transform active:scale-90"
    >
      <span
        className={`flex size-11 items-center justify-center rounded-full bg-black/30 backdrop-blur ${
          active ? "text-gold" : "text-foreground"
        }`}
      >
        <Icon className={`size-6 ${active ? "fill-gold" : ""}`} />
      </span>
      {count && <span className="text-xs text-foreground/80">{count}</span>}
    </button>
  )
}

export function Exp9Feed({ onComplete }: { onComplete: () => void }) {
  const [index, setIndex] = useState(0)
  const [progress, setProgress] = useState(0)
  const [liked, setLiked] = useState<Record<number, boolean>>({})
  const [saved, setSaved] = useState<Record<number, boolean>>({})

  useEffect(() => {
    setProgress(0)
    const id = setInterval(() => {
      setProgress((p) => {
        if (p >= 100) {
          clearInterval(id)
          return 100
        }
        return p + 1.4
      })
    }, 80)
    return () => clearInterval(id)
  }, [index])

  const next = () => {
    if (index < VIDEOS.length - 1) setIndex((i) => i + 1)
  }

  const v = VIDEOS[index]
  const lastDone = index === VIDEOS.length - 1 && progress >= 100

  return (
    <section className="relative flex min-h-screen flex-col">
      {/* Progress segments */}
      <div className="absolute left-0 right-0 top-0 z-20 flex gap-1 px-3 py-2">
        {VIDEOS.map((_, i) => (
          <div key={i} className="h-1 flex-1 overflow-hidden rounded-full bg-white/20">
            <div
              className="h-full bg-gold"
              style={{
                width: i < index ? "100%" : i === index ? `${progress}%` : "0%",
              }}
            />
          </div>
        ))}
      </div>

      {/* Video stage */}
      <div className="relative flex flex-1 flex-col justify-center overflow-hidden bg-gradient-to-b from-[oklch(0.2_0.06_300)] via-[oklch(0.14_0.04_295)] to-[oklch(0.1_0.02_295)] px-5 py-16">
        <div className="absolute inset-0 flex items-center justify-center opacity-40">
          <VeyraOrb size={260} active />
        </div>

        {/* On-screen text */}
        <div key={index} className="animate-float-up relative z-10 mb-auto mt-8 max-w-[78%]">
          <span className="mb-3 inline-block rounded-full bg-primary/30 px-3 py-1 text-xs uppercase tracking-wide text-gold backdrop-blur break-words">
            {v.title}
          </span>
        </div>

        <div className="relative z-10 max-w-[78%] space-y-2">
          {v.onScreen.map((t, i) => (
            <p
              key={i}
              className="text-balance font-serif text-2xl leading-snug text-glow break-words"
            >
              {t}
            </p>
          ))}
        </div>

        {/* Profile + description */}
        <div className="relative z-10 mt-6 max-w-[78%]">
          <div className="mb-2 flex items-center gap-2">
            <span className="flex size-9 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold text-xs font-semibold text-primary-foreground">
              V
            </span>
            <span className="text-sm font-semibold">Veyra</span>
          </div>
          {v.description && (
            <p className="mb-2 text-sm leading-relaxed text-foreground/90 break-words">
              {v.description}
            </p>
          )}
          {v.hashtags.length > 0 && (
            <p className="flex flex-wrap gap-x-2 text-sm text-gold break-words">
              {v.hashtags.map((h) => (
                <span key={h}>{h}</span>
              ))}
            </p>
          )}
        </div>

        {/* Side buttons */}
        <div className="absolute bottom-24 right-3 z-10 flex flex-col items-center gap-4">
          <SideButton
            icon={Heart}
            label="Me gusta"
            active={liked[index]}
            count="1.2k"
            onClick={() => setLiked((s) => ({ ...s, [index]: !s[index] }))}
          />
          <SideButton icon={MessageCircle} label="Comentar" count="86" />
          <SideButton
            icon={Bookmark}
            label="Guardar"
            active={saved[index]}
            onClick={() => setSaved((s) => ({ ...s, [index]: !s[index] }))}
          />
          <SideButton icon={Share2} label="Compartir" />
        </div>
      </div>

      {/* Footer action */}
      <div className="sticky bottom-0 z-20 bg-background/80 px-4 py-4 backdrop-blur">
        {lastDone ? (
          <button
            onClick={() => {
              trackFunnelEvent("feed_completed")
              onComplete()
            }}
            className="animate-float-up flex w-full items-center justify-center gap-2 rounded-full bg-primary py-4 font-medium uppercase tracking-wide text-primary-foreground glow-violet transition-transform active:scale-95"
          >
            Ver el reto
            <ArrowRight className="size-5" />
          </button>
        ) : (
          <button
            onClick={next}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-primary/50 bg-secondary/60 py-3.5 font-medium uppercase tracking-wide text-foreground transition-transform active:scale-95"
          >
            <ChevronUp className="size-5" />
            Siguiente
          </button>
        )}
      </div>
    </section>
  )
}
