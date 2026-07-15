import { readFileSync } from "node:fs"
import { test } from "node:test"
import assert from "node:assert/strict"

const directSource = readFileSync(
  new URL("../components/funnel/direct-vsl-page.tsx", import.meta.url),
  "utf8",
)
const configSource = readFileSync(
  new URL("../components/funnel/config.ts", import.meta.url),
  "utf8",
)
const playerSource = readFileSync(
  new URL(
    "../components/funnel/video-player/vsl-video-player.tsx",
    import.meta.url,
  ),
  "utf8",
)
const immersiveSource = readFileSync(
  new URL("../components/funnel/vsl-interlude.tsx", import.meta.url),
  "utf8",
)

test("direct VSL uses the new conversion header only", () => {
  assert.match(directSource, /Si le escribes ahora,/i)
  assert.match(directSource, /no vas a decir lo que sientes\./i)
  assert.match(directSource, /Vas a escribir desde la herida que él activó\./)
  assert.doesNotMatch(directSource, /No le escribas todavía\./)
  assert.doesNotMatch(directSource, /Mira esto antes de volver al chat\./)
})

test("direct video is wide 3:4 and has muted sound overlay", () => {
  assert.match(directSource, /aspect-\[3\/4\]/)
  assert.match(directSource, /w-\[calc\(100vw-24px\)\]/)
  assert.match(directSource, /max-w-\[520px\]/)
  assert.match(directSource, /startMuted/)
  assert.match(directSource, /showSoundOverlay/)
  assert.match(playerSource, /HAZ CLICK PARA ESCUCHAR/)
  assert.match(playerSource, /video\.muted = startMuted && !unmute/)
  assert.match(playerSource, /await video\.play\(\)/)
})

test("CTA is delayed and never duplicated on mobile", () => {
  assert.match(configSource, /NEXT_PUBLIC_DIRECT_VSL_CTA_DELAY_SECONDS/)
  assert.match(configSource, /directVslCtaDelaySeconds[\s\S]+10/)
  assert.match(directSource, /const \[showCta, setShowCta\] = useState\(false\)/)
  assert.match(directSource, /window\.setTimeout\([\s\S]+directVslCtaDelaySeconds \* 1000/)
  assert.match(directSource, /\{showCta \? \(/)
  assert.match(directSource, /hidden w-full[\s\S]+md:flex/)
  assert.match(directSource, /backdrop-blur-xl md:hidden/)
})

test("direct CTA retains existing handoff and immersive VSL defaults stay unchanged", () => {
  assert.match(directSource, /goToDirectOffer\(hasCompleted\)/)
  assert.match(directSource, /onClick=\{goToOffer\}/)
  assert.match(directSource, /persistFunnelContext/)
  assert.match(playerSource, /startMuted = false/)
  assert.doesNotMatch(immersiveSource, /startMuted|showSoundOverlay/)
})
