import type { PatternKey } from "./types"
import type { ResultLogoMaskMode } from "./video-player/prepared-youtube-result-player"

export type FunnelMode = "demo" | "production"
export type VslProvider = "bunny" | "youtube"

export type FunnelConfig = {
  mode: FunnelMode
  exp1VideoUrl: string
  vslProvider: VslProvider
  vslYoutubeUrl: string
  vslVideoUrl: string
  youtubeCleanMode: boolean
  youtubeIframeScale: number
  youtubeMaskTop: number
  youtubeMaskBottom: number
  youtubeMaskLeft: number
  youtubeMaskRight: number
  resultYoutubeCleanMode: boolean
  resultYoutubeIframeScale: number
  resultYoutubeIframeOffsetX: number
  resultYoutubeIframeOffsetY: number
  resultYoutubeMaskTop: number
  resultYoutubeMaskBottom: number
  resultYoutubeMaskLeft: number
  resultYoutubeMaskRight: number
  resultYoutubeLogoMaskEnabled: boolean
  resultYoutubeLogoMaskMode: ResultLogoMaskMode
  resultYoutubeLogoMaskX: number
  resultYoutubeLogoMaskY: number
  resultYoutubeLogoMaskWidth: number
  resultYoutubeLogoMaskHeight: number
  resultYoutubeLogoMaskRadius: number
  resultYoutubeLogoMaskBlur: number
  resultYoutubeLogoMaskOpacity: number
  resultYoutubeBottomUiShieldEnabled: boolean
  resultYoutubeBottomUiShieldHeight: number
  resultYoutubeBottomUiShieldOpacity: number
  resultYoutubeTopUiShieldEnabled: boolean
  resultYoutubeTopUiShieldHeight: number
  resultYoutubeTopUiShieldOpacity: number
  resultYoutubePosterShieldEnabled: boolean
  resultYoutubeIntroVeilEnabled: boolean
  resultYoutubeIntroVeilDurationMs: number
  resultYoutubeIntroVeilFadeMs: number
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

function readResultLogoMaskMode(): ResultLogoMaskMode {
  const value = cleanPublicEnv(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_MODE,
  )

  if (value === "off" || value === "solid") return value
  if (value === "soft") return value
  return "off"
}

const mode = readMode()

const vslProvider: VslProvider =
  cleanPublicEnv(process.env.NEXT_PUBLIC_VSL_PROVIDER) === "youtube"
    ? "youtube"
    : "bunny"

export const TEMPORARY_BUNNY_VSL_URL =
  "https://vz-febf8c0d-fb8.b-cdn.net/1924db19-affb-41ea-a457-4195d85671c6/playlist.m3u8"

export const resultYoutubeShorts = {
  abandono: "https://www.youtube.com/shorts/rKRWUiWTI3A",
  validacion: "https://www.youtube.com/shorts/lHGOaV-hfEs",
  cierre: "https://www.youtube.com/shorts/Yd-2MW9zMDo",
  culpa: "https://www.youtube.com/shorts/92IEKoTjs64",
  nostalgia: "https://www.youtube.com/shorts/rKRWUiWTI3A",
  "ansiedad-silencio": "https://www.youtube.com/shorts/3OZyBOh6jGg",
} as const

export const resultYoutubeShortsByPattern: Record<PatternKey, string> = {
  A: resultYoutubeShorts.abandono,
  B: resultYoutubeShorts.validacion,
  C: resultYoutubeShorts.cierre,
  D: resultYoutubeShorts.culpa,
  E: resultYoutubeShorts.nostalgia,
  F: resultYoutubeShorts["ansiedad-silencio"],
}

export const funnelConfig: FunnelConfig = {
  mode,
  exp1VideoUrl: cleanPublicEnv(process.env.NEXT_PUBLIC_EXP1_VIDEO_URL) ?? "",
  vslProvider,
  vslYoutubeUrl: cleanPublicEnv(process.env.NEXT_PUBLIC_VSL_YOUTUBE_URL) ?? "",
  vslVideoUrl:
    cleanPublicEnv(process.env.NEXT_PUBLIC_VSL_VIDEO_URL) ??
    TEMPORARY_BUNNY_VSL_URL,
  youtubeCleanMode: process.env.NEXT_PUBLIC_YOUTUBE_CLEAN_MODE !== "false",
  youtubeIframeScale: readNumber(
    process.env.NEXT_PUBLIC_YOUTUBE_IFRAME_SCALE,
    1.12,
  ),
  youtubeMaskTop: readNumber(process.env.NEXT_PUBLIC_YOUTUBE_MASK_TOP, 0),
  youtubeMaskBottom: readNumber(
    process.env.NEXT_PUBLIC_YOUTUBE_MASK_BOTTOM,
    82,
  ),
  youtubeMaskLeft: readNumber(process.env.NEXT_PUBLIC_YOUTUBE_MASK_LEFT, 0),
  youtubeMaskRight: readNumber(process.env.NEXT_PUBLIC_YOUTUBE_MASK_RIGHT, 0),
  resultYoutubeCleanMode:
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_CLEAN_MODE !== "false",
  resultYoutubeIframeScale: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_SCALE,
    1,
  ),
  resultYoutubeIframeOffsetX: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_OFFSET_X,
    0,
  ),
  resultYoutubeIframeOffsetY: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_OFFSET_Y,
    0,
  ),
  resultYoutubeMaskTop: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_MASK_TOP,
    0,
  ),
  resultYoutubeMaskBottom: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_MASK_BOTTOM,
    0,
  ),
  resultYoutubeMaskLeft: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_MASK_LEFT,
    0,
  ),
  resultYoutubeMaskRight: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_MASK_RIGHT,
    0,
  ),
  resultYoutubeLogoMaskEnabled:
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_ENABLED !== "false",
  resultYoutubeLogoMaskMode: readResultLogoMaskMode(),
  resultYoutubeLogoMaskX: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_X,
    50,
  ),
  resultYoutubeLogoMaskY: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_Y,
    49,
  ),
  resultYoutubeLogoMaskWidth: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_WIDTH,
    132,
  ),
  resultYoutubeLogoMaskHeight: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_HEIGHT,
    44,
  ),
  resultYoutubeLogoMaskRadius: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_RADIUS,
    999,
  ),
  resultYoutubeLogoMaskBlur: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_BLUR,
    14,
  ),
  resultYoutubeLogoMaskOpacity: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_OPACITY,
    0.22,
  ),
  resultYoutubeBottomUiShieldEnabled: readBoolean(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_BOTTOM_UI_SHIELD_ENABLED,
    false,
  ),
  resultYoutubeBottomUiShieldHeight: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_BOTTOM_UI_SHIELD_HEIGHT,
    150,
  ),
  resultYoutubeBottomUiShieldOpacity: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_BOTTOM_UI_SHIELD_OPACITY,
    0.82,
  ),
  resultYoutubeTopUiShieldEnabled: readBoolean(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_TOP_UI_SHIELD_ENABLED,
    false,
  ),
  resultYoutubeTopUiShieldHeight: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_TOP_UI_SHIELD_HEIGHT,
    96,
  ),
  resultYoutubeTopUiShieldOpacity: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_TOP_UI_SHIELD_OPACITY,
    0.45,
  ),
  resultYoutubePosterShieldEnabled:
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_POSTER_SHIELD_ENABLED === "true",
  resultYoutubeIntroVeilEnabled: readBoolean(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_ENABLED,
    true,
  ),
  resultYoutubeIntroVeilDurationMs: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_DURATION_MS,
    3000,
  ),
  resultYoutubeIntroVeilFadeMs: readNumber(
    process.env.NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_FADE_MS,
    900,
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
