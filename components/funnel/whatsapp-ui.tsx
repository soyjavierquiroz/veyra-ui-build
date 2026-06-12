"use client"

import type { ReactNode } from "react"
import { ArrowLeft, Phone, Video, MoreVertical } from "lucide-react"

export function WhatsappFrame({
  title = "Equipo GranDiosa Mujer",
  subtitle = "en línea",
  children,
  footer,
}: {
  title?: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-[oklch(0.12_0.02_295)]">
      {/* Header */}
      <header className="sticky top-0 z-10 flex items-center gap-3 bg-[oklch(0.18_0.03_295)] px-3 py-3 shadow">
        <ArrowLeft className="size-5 shrink-0 text-foreground/70" />
        <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-gold font-serif text-sm font-semibold text-primary-foreground">
          GM
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold">{title}</p>
          <p className="truncate text-xs text-emerald-400">{subtitle}</p>
        </div>
        <Video className="size-5 shrink-0 text-foreground/60" />
        <Phone className="size-5 shrink-0 text-foreground/60" />
        <MoreVertical className="size-5 shrink-0 text-foreground/60" />
      </header>

      {/* Chat area */}
      <div
        className="flex flex-1 flex-col gap-2 px-3 py-4"
        style={{
          backgroundImage:
            "radial-gradient(oklch(0.4 0.06 300 / 0.08) 1px, transparent 1px)",
          backgroundSize: "18px 18px",
        }}
      >
        {children}
      </div>

      {footer ? (
        <div className="sticky bottom-0 z-10 bg-[oklch(0.18_0.03_295)] px-3 py-3">
          {footer}
        </div>
      ) : null}
    </div>
  )
}

export function Bubble({
  children,
  side = "in",
  time = "09:41",
}: {
  children: ReactNode
  side?: "in" | "out"
  time?: string
}) {
  return (
    <div
      className={`flex ${side === "in" ? "justify-start" : "justify-end"} animate-float-up`}
    >
      <div
        className={`max-w-[80%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed break-words ${
          side === "in"
            ? "rounded-tl-sm bg-[oklch(0.22_0.04_295)] text-foreground"
            : "rounded-tr-sm bg-[oklch(0.32_0.08_150)] text-foreground"
        }`}
      >
        <div className="whitespace-pre-line">{children}</div>
        <span className="mt-1 block text-right text-[10px] text-foreground/50">
          {time}
        </span>
      </div>
    </div>
  )
}

export function Typing() {
  return (
    <div className="flex justify-start">
      <div className="flex items-center gap-1 rounded-2xl rounded-tl-sm bg-[oklch(0.22_0.04_295)] px-4 py-3">
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="size-2 rounded-full bg-foreground/50"
            style={{
              animation: `soft-blink 1s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>
    </div>
  )
}
