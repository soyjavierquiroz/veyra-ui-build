import { funnelConfig } from "../config"
import type { FunnelEventName } from "../types"

type FunnelEventPayload = Record<string, unknown>

export function trackFunnelEvent(
  eventName: FunnelEventName,
  payload: FunnelEventPayload = {},
) {
  if (!funnelConfig.analyticsEnabled) return
  if (process.env.NODE_ENV === "production") return

  console.debug("[funnel]", eventName, payload)
}
