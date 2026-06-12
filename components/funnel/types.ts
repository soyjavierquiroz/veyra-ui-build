export type Stage =
  | "video"
  | "call"
  | "scanner"
  | "quiz"
  | "reading"
  | "portal"
  | "vsl"
  | "whatsapp-hook"
  | "login"
  | "feed"
  | "offer"
  | "whatsapp-op"

export type PatternKey = "A" | "B" | "C" | "D" | "E" | "F"

export const PATTERNS: Record<
  PatternKey,
  { id: PatternKey; label: string; title: string }
> = {
  A: { id: "A", label: "abandono", title: "miedo al abandono" },
  B: { id: "B", label: "validación", title: "necesidad de validación" },
  C: { id: "C", label: "cierre", title: "necesidad de cierre" },
  D: { id: "D", label: "culpa", title: "culpa afectiva" },
  E: { id: "E", label: "nostalgia", title: "nostalgia idealizada" },
  F: { id: "F", label: "ansiedad por silencio", title: "ansiedad por silencio" },
}
