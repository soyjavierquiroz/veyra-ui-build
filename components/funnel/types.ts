export type Stage =
  | "landing"
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

export type FunnelStep = Stage

export type PatternKey = "A" | "B" | "C" | "D" | "E" | "F"

export type EmotionalPattern = PatternKey

export type QuizAnswer = {
  questionIndex: number
  pattern: PatternKey
}

export type WhatsappMode = "buy" | "doubt"

export type FunnelEventName =
  | "funnel_started"
  | "exp_completed"
  | "quiz_started"
  | "quiz_answered"
  | "pattern_revealed"
  | "login_success"
  | "login_failed"
  | "feed_completed"
  | "offer_cta_clicked"
  | "whatsapp_flow_started"
  | "sales_cta_clicked"

export const PATTERNS: Record<
  PatternKey,
  { id: PatternKey; label: string; title: string }
> = {
  A: { id: "A", label: "abandono", title: "MIEDO A QUE TE OLVIDE" },
  B: { id: "B", label: "validacion", title: "BÚSQUEDA DE VALIDACIÓN" },
  C: { id: "C", label: "cierre", title: "NECESIDAD DE CIERRE" },
  D: { id: "D", label: "culpa", title: "CULPA POR ALEJARTE" },
  E: { id: "E", label: "nostalgia", title: "NOSTALGIA POR LO BONITO" },
  F: { id: "F", label: "ansiedad-silencio", title: "ANSIEDAD POR SILENCIO" },
}
