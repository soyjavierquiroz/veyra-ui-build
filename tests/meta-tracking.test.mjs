import { readFileSync } from "node:fs"
import { test } from "node:test"
import assert from "node:assert/strict"

const metaPixelSource = readFileSync(
  new URL("../components/funnel/lib/meta-pixel.ts", import.meta.url),
  "utf8",
)
const orchestratorSource = readFileSync(
  new URL("../components/funnel/funnel-orchestrator.tsx", import.meta.url),
  "utf8",
)
const handoffSource = readFileSync(
  new URL("../components/funnel/funnel-handoff.ts", import.meta.url),
  "utf8",
)

test("fbc preserves _fbc first and builds from the original fbclid only when needed", () => {
  assert.match(metaPixelSource, /const cookieFbc = readCookie\("_fbc"\)/)
  assert.match(metaPixelSource, /if \(cookieFbc\) \{\s+return \{ fbp, fbc: cookieFbc \}/)
  assert.match(metaPixelSource, /const fbclid = getFbclidFromUrl\(\)/)
  assert.match(metaPixelSource, /const fbc = fbclid \? `fb\.1\.\$\{Date\.now\(\)\}\.\$\{fbclid\}` : ""/)
  assert.doesNotMatch(metaPixelSource, /slice\(0/)
})

test("handoff preserves fbclid from /x9m/fi/mnle to the ads offer", () => {
  assert.match(handoffSource, /"fbclid"/)
  assert.match(handoffSource, /url\.searchParams\.set\(key, value\)/)
  assert.match(handoffSource, /\$\{ADS_PREFIX\}\/o\/no-le-escribas/)
})

test("ads funnel sends Pixel and CAPI with shared dedupe ids", () => {
  assert.match(metaPixelSource, /event_id: eventId/)
  assert.match(metaPixelSource, /\{ eventID: eventId \}/)
  assert.match(metaPixelSource, /fetch\(CAPI_RELAY_URL/)
  assert.match(metaPixelSource, /fbq\(method, eventName, customData, \{ eventID: eventId \}\)/)
})

test("organic /fi/mnle does not pass the Meta or CAPI route gate", () => {
  assert.match(metaPixelSource, /function isAdsFunnelPath/)
  assert.match(metaPixelSource, /FUNNEL_BASE_PATH\.startsWith\(ADS_PREFIX\)/)
  assert.match(metaPixelSource, /`\$\{ADS_PREFIX\}\$\{FUNNEL_BASE_PATH\}`/)
  assert.match(metaPixelSource, /normalizedPathname === adsFunnelPath/)
})

test("funnel bridge events are wired and forbidden conversion events are absent", () => {
  for (const eventName of [
    "PageView",
    "FunnelStart",
    "ResultViewed",
    "VSLStarted",
    "VSLCompleted",
  ]) {
    assert.match(`${metaPixelSource}\n${orchestratorSource}`, new RegExp(eventName))
  }

  for (const forbidden of [
    "Lead",
    "CompleteRegistration",
    "InitiateCheckout",
    "Purchase",
  ]) {
    assert.doesNotMatch(
      `${metaPixelSource}\n${orchestratorSource}`,
      new RegExp(`trackFunnelCustomEvent\\("${forbidden}"`),
    )
    assert.doesNotMatch(
      `${metaPixelSource}\n${orchestratorSource}`,
      new RegExp(`fbq\\([^\\n]+${forbidden}`),
    )
  }
})
