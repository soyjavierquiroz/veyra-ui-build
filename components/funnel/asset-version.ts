const RAW_FUNNEL_BASE_PATH =
  process.env.NEXT_PUBLIC_FUNNEL_BASE_PATH?.trim() || ""

export const ASSET_VERSION =
  process.env.NEXT_PUBLIC_ASSET_VERSION?.trim() || "ed12a5d"

function normalizeBasePath(value: string): string {
  if (!value) return ""

  const trimmed = value.trim()
  if (!trimmed || trimmed === "/") return ""

  const withLeadingSlash = trimmed.startsWith("/")
    ? trimmed
    : `/${trimmed}`

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash
}

export const FUNNEL_BASE_PATH = normalizeBasePath(RAW_FUNNEL_BASE_PATH)

function isExternalOrSpecial(src: string): boolean {
  return (
    src.startsWith("http://") ||
    src.startsWith("https://") ||
    src.startsWith("data:") ||
    src.startsWith("blob:")
  )
}

function isFunnelPublicAsset(src: string): boolean {
  return (
    src.startsWith("/audio/") ||
    src.startsWith("/videos/") ||
    src.startsWith("/images/") ||
    src === "/janny-portrait.png" ||
    src === "/veyra-perfil.webp"
  )
}

function alreadyHasVersion(src: string): boolean {
  return src.includes("?v=") || src.includes("&v=")
}

export function versionAsset(src: string): string {
  if (!src) return src
  if (isExternalOrSpecial(src)) return src
  if (!src.startsWith("/")) return src

  if (!isFunnelPublicAsset(src)) {
    return withFunnelBasePath(src)
  }

  const pathWithBase = withFunnelBasePath(src)

  if (alreadyHasVersion(pathWithBase)) {
    return pathWithBase
  }

  const separator = pathWithBase.includes("?") ? "&" : "?"
  return `${pathWithBase}${separator}v=${encodeURIComponent(ASSET_VERSION)}`
}

export function withFunnelBasePath(path: string): string {
  if (!path) return path
  if (isExternalOrSpecial(path)) return path
  if (!path.startsWith("/")) return path
  if (!FUNNEL_BASE_PATH) return path
  if (path === FUNNEL_BASE_PATH || path.startsWith(`${FUNNEL_BASE_PATH}/`)) {
    return path
  }

  return `${FUNNEL_BASE_PATH}${path}`
}

export function publicAssetPath(folder: string, filename: string): string {
  return versionAsset(["", folder, filename].join("/"))
}

export function rootPublicAsset(filename: string): string {
  return versionAsset(["", filename].join("/"))
}

export function funnelRoute(path: string): string {
  const cleanedPath = path.trim().replace(/^\/+/, "")
  return withFunnelBasePath(["", cleanedPath].join("/"))
}
