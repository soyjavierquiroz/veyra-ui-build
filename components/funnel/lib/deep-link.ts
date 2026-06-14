import type { PatternKey, Stage } from "../types"

const SCENE_QUERY_TO_STEP: Record<string, Stage> = {
  landing: "video",
  "exp1-video": "video",
  "exp2-call": "call",
  "exp3-scanner": "scanner",
  "exp4-quiz": "quiz",
  "exp5-reading": "reading",
  "exp6-portal": "portal",
  "vsl-interlude": "vsl",
  "exp7-whatsapp-hook": "whatsapp-hook",
  "exp8-login": "login",
  "exp9-feed": "feed",
  "exp10-offer": "offer",
  "exp11-whatsapp-op": "whatsapp-op",
}

const PATTERN_QUERY_TO_KEY: Record<string, PatternKey> = {
  abandono: "A",
  miedo: "A",
  "miedo perderlo": "A",
  "miedo a que me olvide": "A",
  validacion: "B",
  "busqueda validacion": "B",
  cierre: "C",
  "necesidad cierre": "C",
  culpa: "D",
  nostalgia: "E",
  ansiedad: "F",
  "ansiedad silencio": "F",
  "ansiedad por silencio": "F",
}

function cleanParam(value: string | null) {
  return value?.trim().toLowerCase() ?? ""
}

function stripAccents(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export function normalizeSceneParam(value: string | null) {
  const scene = cleanParam(value)
  return SCENE_QUERY_TO_STEP[scene] ?? null
}

export function normalizePatternParam(value: string | null) {
  const pattern = stripAccents(cleanParam(value))
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")

  return PATTERN_QUERY_TO_KEY[pattern] ?? null
}

export function getInitialSceneFromUrl() {
  if (typeof window === "undefined") return null

  const params = new URLSearchParams(window.location.search)
  return normalizeSceneParam(params.get("scene"))
}

export function getPatternFromUrl() {
  if (typeof window === "undefined") return null

  const params = new URLSearchParams(window.location.search)
  return normalizePatternParam(params.get("pattern"))
}
