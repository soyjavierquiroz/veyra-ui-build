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
  A: { id: "A", label: "abandono", title: "miedo al abandono" },
  B: { id: "B", label: "validación", title: "necesidad de validación" },
  C: { id: "C", label: "cierre", title: "necesidad de cierre" },
  D: { id: "D", label: "culpa", title: "culpa afectiva" },
  E: { id: "E", label: "nostalgia", title: "nostalgia idealizada" },
  F: { id: "F", label: "ansiedad por silencio", title: "ansiedad por silencio" },
}
