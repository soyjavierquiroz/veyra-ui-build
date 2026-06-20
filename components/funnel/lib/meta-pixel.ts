const ADS_PREFIX =
  (process.env.NEXT_PUBLIC_ADS_PREFIX || "/x9m").replace(/\/$/, "") || "/x9m"
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ""
const CAPI_RELAY_URL =
  process.env.NEXT_PUBLIC_CAPI_RELAY_URL || "https://relay.kuruk.in/v1/events"
const SITE_ID =
  process.env.NEXT_PUBLIC_SITE_ID || "RECONOCIENDO_TU_PODER"
const VISITOR_API_URL =
  process.env.NEXT_PUBLIC_VISITOR_API_URL || "https://ipapi.co/json/"
const FUNNEL_BASE_PATH = normalizePath(
  process.env.NEXT_PUBLIC_FUNNEL_BASE_PATH || "/fi/mnle",
)

type MetaPixelEvent =
  | "PageView"
  | "FunnelStart"
  | "ResultViewed"
  | "VSLStarted"
  | "VSLCompleted"

type MetaPixelWindow = Window & {
  __mnleMetaPixelInitialized?: boolean
  __mnleFunnelPageViewTracked?: boolean
  fbq?: MetaPixelQueue
  _fbq?: MetaPixelQueue
}

type MetaPixelQueue = {
  (...args: unknown[]): void
  callMethod?: (...args: unknown[]) => void
  queue?: unknown[]
  loaded?: boolean
  version?: string
}

type CapiUserData = {
  fbp?: string
  fbc?: string
  client_ip_address?: string
  client_user_agent?: string
}

type CapiPayload = {
  siteId: string
  provider: "agnostic"
  event_name: MetaPixelEvent
  event_id: string
  event_time: number
  event_source_url: string
  action_source: "website"
  integrations: {
    metaPixelId: string
  }
  custom_data: Record<string, unknown>
  user_data: CapiUserData
}

let visitorIpPromise: Promise<string | undefined> | null = null

function normalizePath(pathname: string): string {
  const trimmed = pathname.trim()
  if (!trimmed || trimmed === "/") return "/"

  const withLeadingSlash = trimmed.startsWith("/")
    ? trimmed
    : `/${trimmed}`

  return withLeadingSlash.replace(/\/+$/, "") || "/"
}

function isAdsFunnelPath(pathname: string): boolean {
  const normalizedPathname = normalizePath(pathname)
  const adsFunnelPath = normalizePath(
    FUNNEL_BASE_PATH.startsWith(ADS_PREFIX)
      ? FUNNEL_BASE_PATH
      : `${ADS_PREFIX}${FUNNEL_BASE_PATH}`,
  )

  return (
    normalizedPathname === adsFunnelPath ||
    normalizedPathname.startsWith(`${adsFunnelPath}/`)
  )
}

function createEventId(eventName: MetaPixelEvent): string {
  const prefix = eventName
    .replace(/([a-z0-9])([A-Z])/g, "$1_$2")
    .toLowerCase()

  if (typeof window.crypto?.randomUUID === "function") {
    return `${prefix}_${window.crypto.randomUUID()}`
  }

  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return ""

  const encodedName = `${name}=`
  const cookie = document.cookie
    .split("; ")
    .find((part) => part.startsWith(encodedName))

  if (!cookie) return ""

  try {
    return decodeURIComponent(cookie.slice(encodedName.length))
  } catch {
    return ""
  }
}

function writeCookie(name: string, value: string, days = 90): void {
  if (typeof window === "undefined" || typeof document === "undefined") return

  const secure = window.location.protocol === "https:" ? "; Secure" : ""
  const expires = new Date(
    Date.now() + days * 24 * 60 * 60 * 1000,
  ).toUTCString()
  document.cookie = `${name}=${encodeURIComponent(
    value,
  )}; Expires=${expires}; Path=/; SameSite=Lax${secure}`
}

function getFbclidFromUrl(): string {
  if (typeof window === "undefined") return ""

  try {
    return new URL(window.location.href).searchParams.get("fbclid") || ""
  } catch {
    return ""
  }
}

function getMetaBrowserIds(): Pick<CapiUserData, "fbp" | "fbc"> {
  let fbp = readCookie("_fbp")
  const cookieFbc = readCookie("_fbc")

  if (!fbp) {
    fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 10_000_000_000)}`
    writeCookie("_fbp", fbp)
  }

  if (cookieFbc) {
    return { fbp, fbc: cookieFbc }
  }

  const fbclid = getFbclidFromUrl()
  const fbc = fbclid ? `fb.1.${Date.now()}.${fbclid}` : ""

  if (fbc) {
    writeCookie("_fbc", fbc)
  }

  return {
    fbp,
    ...(fbc ? { fbc } : {}),
  }
}

async function getVisitorIpAddress(): Promise<string | undefined> {
  if (!visitorIpPromise) {
    visitorIpPromise = fetch(VISITOR_API_URL, { keepalive: true })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: unknown) => {
        if (!data || typeof data !== "object") return undefined
        const ip = (data as { ip?: unknown }).ip
        return typeof ip === "string" && ip.trim() ? ip.trim() : undefined
      })
      .catch(() => undefined)
  }

  return visitorIpPromise
}

function cleanUndefined<T extends Record<string, unknown>>(value: T): T {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== ""),
  ) as T
}

function buildCustomData(params: Record<string, unknown>): Record<string, unknown> {
  return {
    funnel_name: "Oráculo psicológico místico",
    funnel_slug: "mnle",
    traffic_channel: "ads",
    ...params,
  }
}

function ensureMetaPixelInitialized(): void {
  if (typeof window === "undefined") return
  if (!PIXEL_ID) return
  if (!isAdsFunnelPath(window.location.pathname)) return

  const metaWindow = window as MetaPixelWindow
  if (metaWindow.__mnleMetaPixelInitialized) return

  metaWindow.__mnleMetaPixelInitialized = true

  const existingFbq = metaWindow.fbq
  if (!existingFbq) {
    const fbq: MetaPixelQueue = (...args: unknown[]) => {
      if (fbq.callMethod) {
        fbq.callMethod(...args)
        return
      }

      fbq.queue?.push(args)
    }

    fbq.queue = []
    fbq.loaded = true
    fbq.version = "2.0"
    metaWindow.fbq = fbq
    metaWindow._fbq = fbq

    const script = document.createElement("script")
    script.async = true
    script.src = "https://connect.facebook.net/en_US/fbevents.js"
    const firstScript = document.getElementsByTagName("script")[0]
    firstScript?.parentNode?.insertBefore(script, firstScript)
  }

  metaWindow.fbq?.("init", PIXEL_ID)
}

async function sendCapiEvent(
  eventName: MetaPixelEvent,
  eventId: string,
  customData: Record<string, unknown>,
): Promise<void> {
  if (!CAPI_RELAY_URL || typeof window === "undefined") return

  const browserIds = getMetaBrowserIds()
  const clientIpAddress = await getVisitorIpAddress()
  const payload: CapiPayload = {
    siteId: SITE_ID,
    provider: "agnostic",
    event_name: eventName,
    event_id: eventId,
    event_time: Math.floor(Date.now() / 1000),
    event_source_url: window.location.href,
    action_source: "website",
    integrations: {
      metaPixelId: PIXEL_ID,
    },
    custom_data: customData,
    user_data: cleanUndefined({
      fbp: browserIds.fbp,
      fbc: browserIds.fbc,
      client_ip_address: clientIpAddress,
      client_user_agent: window.navigator.userAgent,
    }),
  }

  if (new URL(window.location.href).searchParams.get("debug_tracking") === "1") {
    console.info(`[tracking] CAPI ${eventName} event_id=${eventId}`)
  }

  await fetch(CAPI_RELAY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
    keepalive: true,
  }).catch(() => undefined)
}

export function initFunnelMetaPixel(): void {
  if (typeof window === "undefined") return
  if ((window as MetaPixelWindow).__mnleFunnelPageViewTracked) return

  const eventId = trackFunnelCustomEvent("PageView")
  if (eventId) {
    ;(window as MetaPixelWindow).__mnleFunnelPageViewTracked = true
  }
}

export function trackFunnelCustomEvent(
  eventName: MetaPixelEvent,
  params: Record<string, unknown> = {},
): string | null {
  if (typeof window === "undefined") return null
  if (!PIXEL_ID) return null
  if (!isAdsFunnelPath(window.location.pathname)) return null

  ensureMetaPixelInitialized()

  const fbq = (window as MetaPixelWindow).fbq
  if (typeof fbq !== "function") return null

  const eventId = createEventId(eventName)
  const customData = buildCustomData(params)
  const method = eventName === "PageView" ? "track" : "trackCustom"

  fbq(method, eventName, customData, { eventID: eventId })

  if (new URL(window.location.href).searchParams.get("debug_tracking") === "1") {
    console.info(`[tracking] Meta Pixel ${eventName} eventID=${eventId}`)
  }

  void sendCapiEvent(eventName, eventId, customData)

  return eventId
}
