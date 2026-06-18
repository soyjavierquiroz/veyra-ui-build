const ADS_PREFIX =
  (process.env.NEXT_PUBLIC_ADS_PREFIX || "/x9m").replace(/\/$/, "") || "/x9m"
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID || ""

type MetaPixelEvent =
  | "FunnelStart"
  | "ResultViewed"
  | "VSLStarted"
  | "VSLCompleted"

type MetaPixelWindow = Window & {
  __mnleMetaPixelInitialized?: boolean
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

function isAdsPath(pathname: string): boolean {
  return pathname === ADS_PREFIX || pathname.startsWith(`${ADS_PREFIX}/`)
}

export function initFunnelMetaPixel(): void {
  if (typeof window === "undefined") return
  if (!PIXEL_ID) return
  if (!isAdsPath(window.location.pathname)) return

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
  metaWindow.fbq?.("track", "PageView")
}

export function trackFunnelCustomEvent(
  eventName: MetaPixelEvent,
  params: Record<string, unknown> = {},
): void {
  if (typeof window === "undefined") return
  if (!PIXEL_ID) return
  if (!isAdsPath(window.location.pathname)) return

  const fbq = (window as MetaPixelWindow).fbq
  if (typeof fbq !== "function") return

  fbq("trackCustom", eventName, {
    funnel_slug: "mnle",
    ...params,
  })
}
