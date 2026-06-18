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
  vslStarted?: boolean
  vslCompleted?: boolean
}

type StoredFunnelContext = {
  from_funnel?: string
  funnel_slug?: string
  sid?: string
  pattern?: string
  vsl_started?: boolean
  vsl_completed?: boolean
  entry_path?: string
  handoff_path?: string
  tracking_mode?: "ads" | "organic"
  completed_at?: string
}

const SID_KEY = "rtp_funnel_sid_v1"
const CONTEXT_KEY = "rtp_funnel_context_v1"
const PATTERN_KEY = "rtp_funnel_pattern_v1"
const VALID_PATTERNS = new Set([
  "abandono",
  "validacion",
  "cierre",
  "culpa",
  "nostalgia",
  "ansiedad-silencio",
])

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

function stripAccents(value: string): string {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
}

export function normalizeFunnelPattern(value?: string | null): string {
  const normalized = stripAccents(value?.trim().toLowerCase() ?? "")
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-")

  return VALID_PATTERNS.has(normalized) ? normalized : ""
}

export function getPatternFromCurrentUrl(): string {
  const current = getCurrentUrl()
  return normalizeFunnelPattern(current?.searchParams.get("pattern"))
}

export function getStoredFunnelPattern(): string {
  if (typeof window === "undefined") return ""

  try {
    const storedPattern = normalizeFunnelPattern(
      window.sessionStorage.getItem(PATTERN_KEY) ||
        window.localStorage.getItem(PATTERN_KEY),
    )

    if (storedPattern) return storedPattern

    const rawContext = window.localStorage.getItem(CONTEXT_KEY)
    if (!rawContext) return ""

    const context = JSON.parse(rawContext) as { pattern?: unknown }
    return normalizeFunnelPattern(
      typeof context.pattern === "string" ? context.pattern : "",
    )
  } catch {
    return ""
  }
}

export function persistFunnelPattern(pattern?: string | null): void {
  if (typeof window === "undefined") return

  const normalizedPattern = normalizeFunnelPattern(pattern)
  if (!normalizedPattern) return

  try {
    window.sessionStorage.setItem(PATTERN_KEY, normalizedPattern)
  } catch {
    // Best-effort only.
  }

  try {
    window.localStorage.setItem(PATTERN_KEY, normalizedPattern)
  } catch {
    // Best-effort only.
  }

  try {
    const rawContext = window.localStorage.getItem(CONTEXT_KEY)
    const context = rawContext
      ? (JSON.parse(rawContext) as Record<string, unknown>)
      : {}

    window.localStorage.setItem(
      CONTEXT_KEY,
      JSON.stringify({ ...context, pattern: normalizedPattern }),
    )
  } catch {
    // Best-effort only.
  }
}

export function resolveFunnelPattern(explicitPattern?: string | null): string {
  const normalizedExplicit = normalizeFunnelPattern(explicitPattern)
  if (normalizedExplicit) return normalizedExplicit

  const urlPattern = getPatternFromCurrentUrl()
  if (urlPattern) return urlPattern

  return getStoredFunnelPattern()
}

export function buildOfferUrl(context: FunnelHandoff = {}): string {
  const current = getCurrentUrl()
  const pathname = current?.pathname || ""
  const isAds = isAdsPath(pathname)
  const sid = context.sid || getOrCreateFunnelSid()
  const pattern = resolveFunnelPattern(context.pattern)

  const offerPath = isAds
    ? `${ADS_PREFIX}/o/no-le-escribas`
    : "/o/no-le-escribas"

  const url = new URL(offerPath, OFFER_ORIGIN)

  url.searchParams.set("from_funnel", "mnle")
  url.searchParams.set("funnel_slug", "mnle")
  url.searchParams.set("sid", sid)
  url.searchParams.set("pattern", pattern)
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
  const pattern =
    context.pattern === ""
      ? ""
      : context.pattern !== undefined
        ? normalizeFunnelPattern(context.pattern)
        : resolveFunnelPattern()

  const handoffPath = isAds
    ? `${ADS_PREFIX}/o/no-le-escribas`
    : "/o/no-le-escribas"

  let existingContext: StoredFunnelContext = {}

  try {
    const rawContext = window.localStorage.getItem(CONTEXT_KEY)
    existingContext = rawContext
      ? (JSON.parse(rawContext) as StoredFunnelContext)
      : {}
  } catch {
    existingContext = {}
  }

  const payload = {
    from_funnel: "mnle",
    funnel_slug: "mnle",
    sid,
    pattern,
    vsl_started: Boolean(context.vslStarted ?? existingContext.vsl_started),
    vsl_completed: Boolean(context.vslCompleted ?? existingContext.vsl_completed),
    entry_path: window.location.pathname,
    handoff_path: handoffPath,
    tracking_mode: isAds ? "ads" : "organic",
    completed_at: context.vslCompleted
      ? new Date().toISOString()
      : existingContext.completed_at || "",
  }

  try {
    window.localStorage.setItem(CONTEXT_KEY, JSON.stringify(payload))
  } catch {
    // No bloquear navegación si localStorage falla.
  }

  persistFunnelPattern(pattern)
}

export function goToOffer(context: FunnelHandoff = {}): void {
  const sid = context.sid || getOrCreateFunnelSid()
  const finalContext = { ...context, sid }

  persistFunnelContext(finalContext)

  if (typeof window === "undefined") return

  window.location.assign(buildOfferUrl(finalContext))
}
