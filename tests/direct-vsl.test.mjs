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

test("direct video fills its tall mobile frame and has muted sound overlay", () => {
  assert.match(directSource, /h-\[min\(70vh,calc\(\(100vw-24px\)\*1\.42\)\)\]/)
  assert.match(directSource, /md:aspect-\[3\/4\]/)
  assert.match(directSource, /w-\[calc\(100vw-24px\)\]/)
  assert.match(directSource, /max-w-\[520px\]/)
  assert.match(directSource, /videoFit="cover"/)
  assert.match(directSource, /videoScale=\{1\.12\}/)
  assert.match(directSource, /startMuted/)
  assert.match(directSource, /showSoundOverlay/)
  assert.match(playerSource, /HAZ CLICK PARA ESCUCHAR/)
  assert.match(playerSource, /objectFit: videoFit/)
  assert.match(playerSource, /transform: `scale\(/)
  assert.match(playerSource, /video\.muted = startMuted && !unmute/)
  assert.match(playerSource, /video\.currentTime = 0/)
  assert.match(playerSource, /video\.volume = 1/)
  assert.match(playerSource, /await video\.play\(\)/)
  assert.doesNotMatch(directSource, /object-contain/)
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
  assert.match(playerSource, /videoFit = "contain"/)
  assert.match(playerSource, /videoScale = 1/)
  assert.doesNotMatch(
    immersiveSource,
    /startMuted|showSoundOverlay|videoFit|videoScale/,
  )
})
