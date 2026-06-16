const normalizePrefix = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed || trimmed === "/") return ""

  const withLeadingSlash = trimmed.startsWith("/")
    ? trimmed
    : `/${trimmed}`

  return withLeadingSlash.endsWith("/")
    ? withLeadingSlash.slice(0, -1)
    : withLeadingSlash
}

export const ADS_PREFIX = normalizePrefix(
  process.env.NEXT_PUBLIC_ADS_PREFIX || "/x9m",
) || "/x9m"

export const OFFER_ORIGIN =
  process.env.NEXT_PUBLIC_OFFER_ORIGIN?.trim() ||
  "https://reconociendotupoder.com"

export type FunnelHandoff = {
  sid?: string
  pattern?: string
  vslCompleted?: boolean
}

const SID_KEY = "rtp_funnel_sid_v1"
const CONTEXT_KEY = "rtp_funnel_context_v1"

export function isAdsPath(pathname: string): boolean {
  return pathname === ADS_PREFIX || pathname.startsWith(`${ADS_PREFIX}/`)
}

function createFallbackSid(): string {
  return `mnle-${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2, 10)}`
}

export function getOrCreateFunnelSid(): string {
  if (typeof window === "undefined") {
    return createFallbackSid()
  }

  try {
    const existing = window.localStorage.getItem(SID_KEY)
    if (existing) return existing

    const nextSid =
      typeof window.crypto?.randomUUID === "function"
        ? `mnle-${window.crypto.randomUUID()}`
        : createFallbackSid()

    window.localStorage.setItem(SID_KEY, nextSid)
    return nextSid
  } catch {
    return createFallbackSid()
  }
}

function getCurrentUrl(): URL | null {
  if (typeof window === "undefined") return null

  try {
    return new URL(window.location.href)
  } catch {
    return null
  }
}

export function buildOfferUrl(context: FunnelHandoff = {}): string {
  const current = getCurrentUrl()
  const pathname = current?.pathname || ""
  const isAds = isAdsPath(pathname)
  const sid = context.sid || getOrCreateFunnelSid()

  const offerPath = isAds
    ? `${ADS_PREFIX}/o/no-le-escribas`
    : "/o/no-le-escribas"

  const url = new URL(offerPath, OFFER_ORIGIN)

  url.searchParams.set("from_funnel", "mnle")
  url.searchParams.set("funnel_slug", "mnle")
  url.searchParams.set("sid", sid)
  url.searchParams.set("pattern", context.pattern || "")
  url.searchParams.set("vsl_completed", context.vslCompleted ? "1" : "0")

  const preserve = [
    "fbclid",
    "ttclid",
    "gclid",
    "utm_source",
    "utm_medium",
    "utm_campaign",
    "utm_content",
    "utm_term",
  ]

  if (current) {
    for (const key of preserve) {
      const value = current.searchParams.get(key)
      if (value) url.searchParams.set(key, value)
    }
  }

  return url.toString()
}

export function persistFunnelContext(context: FunnelHandoff = {}): void {
  if (typeof window === "undefined") return

  const sid = context.sid || getOrCreateFunnelSid()
  const isAds = isAdsPath(window.location.pathname)

  const handoffPath = isAds
    ? `${ADS_PREFIX}/o/no-le-escribas`
    : "/o/no-le-escribas"

  const payload = {
    from_funnel: "mnle",
    funnel_slug: "mnle",
    sid,
    pattern: context.pattern || "",
    vsl_completed: Boolean(context.vslCompleted),
    entry_path: window.location.pathname,
    handoff_path: handoffPath,
    tracking_mode: isAds ? "ads" : "organic",
    completed_at: new Date().toISOString(),
  }

  try {
    window.localStorage.setItem(CONTEXT_KEY, JSON.stringify(payload))
  } catch {
    // No bloquear navegación si localStorage falla.
  }
}

export function goToOffer(context: FunnelHandoff = {}): void {
  const sid = context.sid || getOrCreateFunnelSid()
  const finalContext = { ...context, sid }

  persistFunnelContext(finalContext)

  if (typeof window === "undefined") return

  window.location.assign(buildOfferUrl(finalContext))
}
