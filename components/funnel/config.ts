import type { PatternKey } from "./types"
import { publicAssetPath } from "./asset-version"

export type FunnelMode = "demo" | "production"
export type ResultVideoObjectFit = "cover" | "contain"

export type FunnelConfig = {
  mode: FunnelMode
  exp1VideoUrl: string
  vslVideoUrl: string
  resultVideoObjectFit: ResultVideoObjectFit
  resultIntroVeilDurationMs: number
  resultIntroVeilFadeMs: number
  resultIntroVeilOpacity: number
  resultVideoReadyTimeoutMs: number
  resultVideoFallbackDurationSeconds: number
  whatsappNumber: string
  whatsappBaseUrl: string
  accessLink: string
  qrImageUrl: string
  analyticsEnabled: boolean
  priceLabel: "Bs 69"
  portalPassword: "PAUSA7"
}

function cleanPublicEnv(value: string | undefined): string | undefined {
  return value && value.trim().length > 0 ? value.trim() : undefined
}

function readMode(): FunnelMode {
  return cleanPublicEnv(process.env.NEXT_PUBLIC_FUNNEL_MODE) === "production"
    ? "production"
    : "demo"
}

function readBoolean(value: string | undefined, fallback: boolean): boolean {
  value = cleanPublicEnv(value)
  if (!value) return fallback
  return ["1", "true", "yes", "on"].includes(value.toLowerCase())
}

function readNumber(value: string | undefined, fallback: number): number {
  const cleaned = cleanPublicEnv(value)
  if (!cleaned) return fallback

  const numeric = Number(cleaned)
  return Number.isFinite(numeric) ? numeric : fallback
}

const mode = readMode()

export const TEMPORARY_BUNNY_VSL_URL =
  "https://vz-febf8c0d-fb8.b-cdn.net/1924db19-affb-41ea-a457-4195d85671c6/playlist.m3u8"

export const resultMp4Videos = {
  abandono: publicAssetPath("videos", "resp1-veyra-final.mp4"),
  validacion: publicAssetPath("videos", "resp2-veyra-final.mp4"),
  cierre: publicAssetPath("videos", "resp3-veyra-final.mp4"),
  culpa: publicAssetPath("videos", "resp4-veyra-final.mp4"),
  nostalgia: publicAssetPath("videos", "resp5-veyra-final.mp4"),
  "ansiedad-silencio": publicAssetPath(
    "videos",
    "resp6-veyra-final.mp4",
  ),
} as const

export const resultMp4VideosByPattern: Record<PatternKey, string> = {
  A: resultMp4Videos.abandono,
  B: resultMp4Videos.validacion,
  C: resultMp4Videos.cierre,
  D: resultMp4Videos.culpa,
  E: resultMp4Videos.nostalgia,
  F: resultMp4Videos["ansiedad-silencio"],
}

export const funnelConfig: FunnelConfig = {
  mode,
  exp1VideoUrl: cleanPublicEnv(process.env.NEXT_PUBLIC_EXP1_VIDEO_URL) ?? "",
  vslVideoUrl:
    cleanPublicEnv(process.env.NEXT_PUBLIC_VSL_VIDEO_URL) ??
    TEMPORARY_BUNNY_VSL_URL,
  resultVideoObjectFit:
    cleanPublicEnv(process.env.NEXT_PUBLIC_RESULT_VIDEO_OBJECT_FIT) ===
    "contain"
      ? "contain"
      : "cover",
  resultIntroVeilDurationMs: readNumber(
    process.env.NEXT_PUBLIC_RESULT_INTRO_VEIL_DURATION_MS,
    3000,
  ),
  resultIntroVeilFadeMs: readNumber(
    process.env.NEXT_PUBLIC_RESULT_INTRO_VEIL_FADE_MS,
    900,
  ),
  resultIntroVeilOpacity: 0.92,
  resultVideoReadyTimeoutMs: readNumber(
    process.env.NEXT_PUBLIC_RESULT_VIDEO_READY_TIMEOUT_MS,
    8000,
  ),
  resultVideoFallbackDurationSeconds: readNumber(
    process.env.NEXT_PUBLIC_RESULT_VIDEO_FALLBACK_DURATION_SECONDS,
    65,
  ),
  whatsappNumber: cleanPublicEnv(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER) ?? "",
  whatsappBaseUrl:
    cleanPublicEnv(process.env.NEXT_PUBLIC_WHATSAPP_BASE_URL) ?? "https://wa.me",
  accessLink: cleanPublicEnv(process.env.NEXT_PUBLIC_ACCESS_LINK) ?? "/reto/",
  qrImageUrl: cleanPublicEnv(process.env.NEXT_PUBLIC_QR_IMAGE_URL) ?? "",
  analyticsEnabled: readBoolean(
    process.env.NEXT_PUBLIC_FUNNEL_ANALYTICS_ENABLED,
    mode === "demo",
  ),
  priceLabel: "Bs 69",
  portalPassword: "PAUSA7",
}
