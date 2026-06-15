const ASSET_VERSION =
  process.env.NEXT_PUBLIC_ASSET_VERSION?.trim() || "ed12a5d"

export function versionAsset(src: string): string {
  if (!src) return src
  if (src.startsWith("data:")) return src
  if (src.startsWith("blob:")) return src
  if (!src.startsWith("/")) return src
  if (src.includes("?v=") || src.includes("&v=")) return src

  const separator = src.includes("?") ? "&" : "?"
  return `${src}${separator}v=${encodeURIComponent(ASSET_VERSION)}`
}

export { ASSET_VERSION }
