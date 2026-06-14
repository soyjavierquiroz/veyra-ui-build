export type FunnelMode = "demo" | "production"

export type FunnelConfig = {
  mode: FunnelMode
  exp1VideoUrl: string
  vslVideoUrl: string
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

const mode = readMode()

export const TEMPORARY_BUNNY_VSL_URL =
  "https://vz-febf8c0d-fb8.b-cdn.net/1924db19-affb-41ea-a457-4195d85671c6/playlist.m3u8"

export const funnelConfig: FunnelConfig = {
  mode,
  exp1VideoUrl: cleanPublicEnv(process.env.NEXT_PUBLIC_EXP1_VIDEO_URL) ?? "",
  vslVideoUrl:
    cleanPublicEnv(process.env.NEXT_PUBLIC_VSL_VIDEO_URL) ??
    TEMPORARY_BUNNY_VSL_URL,
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
