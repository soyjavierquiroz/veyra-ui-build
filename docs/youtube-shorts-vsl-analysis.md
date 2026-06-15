# Informe - YouTube Shorts para VSL Veyra

## Estado final

YouTube fue retirado del funnel activo por inestabilidad de iframe/autoplay/UI en móviles. EXP 5 volvió a MP4 local controlado, con precarga del video correcto por patrón y reproducción mediante `<video>` nativo.

La VSL activa permanece en Bunny/HLS mediante `VslVideoPlayer`. Este documento queda como historial técnico de la exploración YouTube/Shorts y no describe el runtime activo actual.

## 1. Resumen ejecutivo

Es viable usar un YouTube Short como fuente de la VSL si se trata como un video normal de YouTube por `videoId` y se reproduce mediante YouTube IFrame API en cliente. No es viable prometer una experiencia idéntica a Bunny/HLS: YouTube conserva control sobre branding, estado del embed, anuncios, tracking, políticas de autoplay y cambios futuros.

Recomendación: crear un player separado para YouTube Shorts en `components/funnel/video-player/youtube-shorts-vsl-player.tsx` y dejar intacto el player Bunny actual. Luego `VslInterlude` decide por proveedor (`bunny` o `youtube`). Esto reduce riesgo porque Bunny usa `<video>`/HLS y YouTube usa iframe/API/cross-origin con reglas distintas.

## 2. Hallazgos en Presto Player

Archivos relevantes inspeccionados:

- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/readme.txt`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/templates/video.php`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/templates/fallback.php`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/src/shared/util.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/src/admin/blocks/util.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/src/admin/blocks/blocks/youtube/edit.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/src/admin/blocks/blocks/youtube/block.json`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/src/admin/blocks/shared/Player.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/src/admin/blocks/shared/presets/Behavior.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/dist/components/components/presto-youtube2.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/dist/components/components/presto-player2.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/dist/components/components/presto-muted-overlay2.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/dist/components/components/presto-dynamic-overlays2.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/dist/components/components/presto-cta-overlay2.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/dist/components/components/presto-cta-overlay-ui2.js`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player-pro/inc/Services/Bunny/*` y controladores Pro relacionados con Bunny/licencia/email/analytics.

Hallazgos:

- Presto Free contiene la implementación principal del player. Presto Pro añade integraciones Pro, especialmente Bunny, analítica, email, licencia y servicios relacionados.
- Presto usa componentes web Stencil y Plyr. Para YouTube renderiza un contenedor con `data-plyr-provider="youtube"` y `data-plyr-embed-id={videoId}`; Plyr carga la YouTube IFrame API (`https://www.youtube.com/iframe_api`) y crea/controla el iframe.
- Presto también incluye fallback PHP para YouTube con iframe `https://www.youtube.com/embed/{video_id}` y parámetros `iv_load_policy=3`, `modestbranding=1`, `playsinline=1`, `showinfo=0`, `rel=0`, `enablejsapi=1`.
- En la configuración transformada del player, Presto pasa a Plyr/YouTube: `rel: 0`, `showinfo: 0`, `iv_load_policy: 3`, `modestbranding: 1`, `customControls: true`, `noCookie`, `playsinline`.
- Presto reconoce URLs de Shorts en frontend con regex que incluye `shorts/` y exige ID de 11 caracteres. En un detector admin también reconoce `youtube.com/shorts/{id}`.
- La opción "Hide Youtube UI (Experimental)" existe como preset (`hide_youtube`) y agrega clase `hide-youtube-ui`, pero no equivale a eliminar legal o técnicamente toda la marca de YouTube.
- Los controles visibles son de Plyr/custom skin cuando se habilitan. Para ocultarlos, Presto no depende de controles nativos de YouTube sino de `customControls`, parámetros del embed y CSS.
- Overlays: Presto añade overlays propios dentro del wrapper del player para CTA, email, watermark/dynamic overlays y muted preview. No encontré una solución dedicada a "bloquear todos los clicks del usuario sobre YouTube" como requisito VSL; sí hay overlays que pueden capturar clicks en casos concretos.
- Barra/progreso: Presto usa el progreso real de Plyr y skins CSS. No encontré una barra psicológica simulada estilo Panda exactamente como la de Veyra; Veyra ya tiene esa lógica propia.
- Fin del video: Presto escucha `ended`; puede loop, resetear o ir al inicio. Para YouTube, en `go-to-start` hace `restart()` y luego `stop()`.

## 3. Autoplay con sonido

Autoplay con sonido no está garantizado. En Chrome, el autoplay silenciado está permitido, pero autoplay con sonido solo se permite bajo condiciones como interacción previa con el dominio, engagement previo en desktop, instalación/PWA, o delegación desde el top frame al iframe. Fuente: Chrome Autoplay Policy, https://developer.chrome.com/blog/autoplay.

En Safari/WebKit, la recomendación oficial es asumir que `<video>` o `<audio>` puede requerir gesto de usuario y detectar rechazos de autoplay. Fuente: WebKit, https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/.

Para Veyra, el click real en `ABRIR EL CAMINO HACIA JANNY` puede servir como gesto de usuario si la navegación/render de la VSL y el `playVideo()` ocurren inmediatamente como consecuencia de ese click. Aun así, hay riesgos en iPhone/Safari y Chrome móvil, especialmente por iframe cross-origin y por el timing entre click, cambio de escena, carga de script y creación del player.

Fallback recomendado:

1. Intentar `unMute()` y `playVideo()` en `onReady`.
2. Detectar si no llega `PLAYING` en una ventana corta.
3. Mostrar botón propio `REPRODUCIR MENSAJE DE JANNY`.
4. En el click del botón, llamar `unMute()` y `playVideo()`.

Presto no demuestra una forma mágica de saltarse políticas. Para muted preview, reproduce silenciado y luego un overlay propio permite continuar. En algunos flujos de lazy load intenta reproducir y alternar muted, pero sigue dependiendo de browser policy y/o gesto real.

## 4. Logos y branding de YouTube

No se puede garantizar quitar completamente el logo/branding de YouTube en el embed estándar. `modestbranding` está deprecado y ya no tiene efecto según la documentación oficial de YouTube: https://developers.google.com/youtube/player_parameters.

`rel=0` tampoco elimina por completo relacionados; hoy limita relacionados a videos del mismo canal. `showinfo` fue deprecado/removido y YouTube indica que título/canal/avatar forman parte de la experiencia del embed en ciertos estados.

Presto reduce branding mediante:

- `controls/customControls` vía Plyr.
- `rel=0`.
- `iv_load_policy=3`.
- `playsinline=1`.
- `modestbranding=1`, aunque actualmente deprecado.
- Overlays y skins propios en el wrapper.

Recomendación para Veyra: no prometer "sin logos". Se puede buscar una experiencia limpia con controles nativos ocultos y overlay propio, pero no se debe recomendar tapar o alterar branding de YouTube de forma que viole términos. Si "sin logos visibles garantizado" es requisito duro, usar Bunny/HLS o hosting propio es la vía correcta.

## 5. YouTube Shorts

Un Short se puede tratar como un video de YouTube normal porque el identificador es el mismo formato de 11 caracteres:

- `https://www.youtube.com/shorts/XXXXXXXXXXX`
- `https://youtu.be/XXXXXXXXXXX`
- `https://www.youtube.com/watch?v=XXXXXXXXXXX`
- `https://www.youtube.com/embed/XXXXXXXXXXX`

Helper recomendado: extraer el ID con URL parsing y fallback regex para patrones `shorts/`, `watch?v=`, `youtu.be/`, `embed/`, `v/`. Validar longitud 11 y caracteres esperados.

Embed recomendado:

- Cargar `https://www.youtube.com/iframe_api` solo en cliente.
- Crear `new YT.Player(container, { videoId, playerVars, events })`.
- Usar player normal por ID, no URL `/shorts/` como `src` directo.

Parámetros recomendados:

- `autoplay: 1`
- `controls: 0`
- `disablekb: 1`
- `playsinline: 1`
- `rel: 0`
- `fs: 0`
- `iv_load_policy: 3`
- `enablejsapi: 1`
- `origin: window.location.origin`

`modestbranding` puede incluirse por compatibilidad, pero no debe considerarse funcional. Fuente oficial sobre parámetros y deprecaciones: https://developers.google.com/youtube/player_parameters.

Limitaciones de Shorts:

- El embed final es el player normal de YouTube por ID, no la UI vertical de Shorts.
- Puede aparecer letterboxing/cropping según el aspect ratio del video y el contenedor.
- YouTube conserva el control de branding, overlays internos, errores, restricciones de edad/región, anuncios y comportamiento futuro.

## 6. Arquitectura recomendada para Veyra

### Opcion A - Extender player actual Bunny

Pros:

- Reutiliza nombre y props existentes.
- Menos archivos al principio.

Contras:

- Mezcla `<video>`/HLS con iframe/API cross-origin.
- Aumenta ramas internas, cleanup distinto y estados incompatibles.
- Riesgo de romper un player Bunny que ya funciona.

### Opcion B - Crear YouTubeShortsVslPlayer separado

Pros:

- Aisla reglas de YouTube, script loader, `YT.Player`, playerVars y fallback de autoplay.
- Mantiene estable el Bunny HLS actual.
- Permite ajustar CSS mobile-first sin condicionar HLS.
- Más fácil de retirar si YouTube no cumple branding/autoplay esperado.

Contras:

- Duplica lógica común como barra simulada, overlay de bloqueo y botón fallback.
- `VslInterlude` necesita decidir provider.

### Opcion C - Crear provider system común

Pros:

- Escala mejor si habrá más providers.
- Permite compartir barra simulada, shell, botón fallback y eventos.

Contras:

- Más arquitectura antes de saber si YouTube Shorts cumple negocio.
- Puede sobrediseñar una migración de una sola fuente.

Recomendación: Opción B ahora. Crear `components/funnel/video-player/youtube-shorts-vsl-player.tsx` y una selección mínima en `VslInterlude`. Más adelante, si se mantienen dos providers por tiempo largo, extraer UI común de barra/overlay a componentes pequeños.

## 7. API propuesta

Props:

```ts
type YouTubeShortsVslPlayerProps = {
  videoUrl: string
  autoPlay?: boolean
  startWithSound?: boolean
  simulatedDurationSeconds?: number
  blockUserInteraction?: boolean
  className?: string
  onEnded?: () => void
  onPlaybackBlocked?: () => void
}
```

Config por env:

```txt
NEXT_PUBLIC_VSL_PROVIDER=youtube
NEXT_PUBLIC_VSL_YOUTUBE_URL=https://www.youtube.com/shorts/XXXXXXXXXXX
NEXT_PUBLIC_VSL_VIDEO_URL=https://vz-.../playlist.m3u8
```

O en `funnelConfig`:

```ts
funnelConfig = {
  vslProvider: "youtube",
  vslYoutubeUrl: "...",
  vslVideoUrl: "...",
}
```

Para static export es compatible siempre que todo sea client-side y solo use `NEXT_PUBLIC_*` o config estática.

## 8. Plan de implementación

1. Crear helper para extraer YouTube `videoId`.
2. Cargar YouTube IFrame API client-side con promesa global idempotente.
3. Crear `YouTubeShortsVslPlayer`.
4. Renderizar el iframe full dentro del shell móvil actual.
5. Usar `playerVars`: `autoplay=1`, `controls=0`, `disablekb=1`, `playsinline=1`, `rel=0`, `fs=0`, `iv_load_policy=3`, `enablejsapi=1`, `origin=window.location.origin`.
6. En `onReady`, intentar `unMute()` y `playVideo()` si `startWithSound`.
7. Si no inicia, mostrar botón `REPRODUCIR MENSAJE DE JANNY`.
8. Añadir overlay transparente para bloquear clicks del usuario.
9. Reutilizar/duplicar de forma acotada la barra simulada de Veyra.
10. Manejar `onStateChange`: `PLAYING`, `PAUSED`, `ENDED`, errores.
11. Cleanup al desmontar con `destroy()`.
12. Añadir `NEXT_PUBLIC_VSL_PROVIDER` y `NEXT_PUBLIC_VSL_YOUTUBE_URL`.
13. Mantener Bunny como fallback.

## 9. Riesgos

- Autoplay con sonido no garantizado en todos los navegadores.
- El gesto de usuario puede perderse si la carga de YouTube tarda demasiado.
- YouTube branding no es removible totalmente en embed estándar.
- `modestbranding` ya no tiene efecto.
- `rel=0` no elimina relacionados; solo los restringe al mismo canal.
- Shorts embed puede comportarse como player normal, no como UI Shorts.
- YouTube puede mostrar anuncios, restricciones, overlays o errores propios.
- `youtube.com` / `youtube-nocookie.com` implican terceros, tracking/consent y posibles bloqueos por adblockers.
- Iframe cross-origin limita inspección y control fino.
- Cambios futuros de YouTube pueden alterar la experiencia.

## 10. Recomendacion final

Yo haría esto en Veyra:

1. Mantener `VslVideoPlayer` como Bunny/HLS únicamente.
2. Crear `YouTubeShortsVslPlayer` separado.
3. Añadir `vslProvider` y `vslYoutubeUrl` a `funnelConfig`.
4. En `VslInterlude`, seleccionar provider.
5. Intentar autoplay con sonido justo después del click de entrada a VSL, pero incluir fallback visible.
6. No prometer ni forzar "sin logo YouTube"; para experiencia sin branding garantizada, conservar Bunny/HLS.

Siguiente prompt recomendado:

```txt
Implementar YouTubeShortsVslPlayer separado para Veyra según docs/youtube-shorts-vsl-analysis.md.
No modificar el player Bunny salvo lo mínimo para seleccionar provider en VslInterlude/config.
Mantener compatible con Next.js static export.
Agregar helper de videoId, loader client-side de YouTube IFrame API, overlay de bloqueo, barra simulada y fallback de autoplay.
No copiar código de Presto.
```

Fuentes oficiales consultadas:

- YouTube Player Parameters: https://developers.google.com/youtube/player_parameters
- YouTube IFrame Player API: https://developers.google.com/youtube/iframe_api_reference
- Chrome Autoplay Policy: https://developer.chrome.com/blog/autoplay
- WebKit Autoplay Policy: https://webkit.org/blog/7734/auto-play-policy-changes-for-macos/
- YouTube Terms: https://www.youtube.com/static?template=terms

## Estado de implementación en Veyra

- Se creó `YouTubeShortsVslPlayer` separado en `components/funnel/video-player/youtube-shorts-vsl-player.tsx`.
- Se agregó `youtube-utils.ts` para extraer y validar IDs de YouTube Shorts, `youtu.be`, `watch?v=`, `embed`, `/v/` e ID directo.
- Se mantiene `VslVideoPlayer` Bunny/HLS intacto.
- Se agregó selección por provider en `VslInterlude` mediante `funnelConfig.vslProvider`.
- Se agregaron variables `NEXT_PUBLIC_VSL_PROVIDER`, `NEXT_PUBLIC_VSL_YOUTUBE_URL` y `NEXT_PUBLIC_VSL_VIDEO_URL`.
- Se implementó modo clean experimental con playerVars, iframe scale/crop, máscaras, gradientes, blocker transparente y barra simulada.
- Si YouTube no tiene URL válida, se muestra `Short de YouTube pendiente de configuración.`
- Si autoplay con sonido falla, se muestra el fallback `REPRODUCIR MENSAJE DE JANNY`.

## Uso extendido en EXP 5

El mismo patrón de YouTube clean mode se extendió a EXP 5 para los 6 videos de respuesta de Veyra. EXP 5 ya no usa los MP4 locales `resp*-veyra-final.mp4` como fuente principal; ahora usa un prepared player de YouTube Shorts persistente dentro del shell mobile-first y selecciona el Short según el patrón dominante.

Mapeo activo:

- `abandono` / `MIEDO A QUE TE OLVIDE`: https://www.youtube.com/shorts/rKRWUiWTI3A
- `validacion` / `BÚSQUEDA DE VALIDACIÓN`: https://www.youtube.com/shorts/lHGOaV-hfEs
- `cierre` / `NECESIDAD DE CIERRE`: https://www.youtube.com/shorts/Yd-2MW9zMDo
- `culpa` / `CULPA POR ALEJARTE`: https://www.youtube.com/shorts/92IEKoTjs64
- `nostalgia` / `NOSTALGIA POR LO BONITO`: https://www.youtube.com/shorts/rKRWUiWTI3A
- `ansiedad-silencio` / `ANSIEDAD POR SILENCIO`: https://www.youtube.com/shorts/3OZyBOh6jGg

## EXP 5 — muted pre-roll + reveal with sound

EXP 4 ya no usa `REVELAR MENSAJE DE VEYRA` como botón de cambio de escena. Cuando detecta el patrón dominante, el orquestador prepara el Short correspondiente y entra automáticamente a EXP 5.

EXP 5 monta el prepared player de YouTube del patrón y arranca un pre-roll real muted: `loadVideoById({ videoId, startSeconds: 0 })`, `mute()`, `setVolume(0)` y `playVideo()`. Si el player recibe `YT.PlayerState.PLAYING` muted, aparece el único botón previo al video: `REVELAR MENSAJE DE VEYRA`, superpuesto sobre el player y sobre el overlay oscuro. Si YouTube no llega a `PLAYING` muted en aprox. 2800ms, el mismo botón aparece igualmente para convertir el click en el gesto real de reproducción.

Ese botón es el gesto real de usuario: según el estado del iframe llama `loadVideoById({ videoId, startSeconds: 0 })` o `seekTo(0, true)`, luego `unMute()`, `setVolume(100)` y `playVideo()` directamente sobre el mismo player. Luego oculta el botón, inicia el loop `/audio/loop-result.mp3` y mantiene el overlay oscuro durante 3000ms. El fade default es 900ms, la opacidad default es `0.92`, no muestra texto, no usa imagen externa y tiene `pointer-events: none`.

Si YouTube falla después del click o no llega `PLAYING` después de al menos 4000ms, EXP 5 no muestra otro botón distinto. Reaparece el mismo botón `REVELAR MENSAJE DE VEYRA` para reintentar sobre el mismo player. No existe fallback `REPRODUCIR MENSAJE DE VEYRA` en EXP 5.

Los deep links como `/?scene=exp5-reading&pattern=abandono` entran a EXP 5, arrancan muted pre-roll, muestran `REVELAR MENSAJE DE VEYRA` cuando YouTube ya está `PLAYING` muted o, si autoplay muted no confirma, tras el timeout manual. El CTA final sigue siendo `ABRIR EL CAMINO HACIA JANNY`, y el loop `/audio/loop-result.mp3` se detiene antes de entrar a la VSL.

El bridge solo acepta `ENDED` después de una reproducción con sonido confirmada. Si el muted pre-roll termina antes del click, no avanza el funnel: se reinicia o mantiene el pre-roll muted y el click siempre hace `seekTo(0, true)`.

## Ajuste EXP 5 — video directo sin thumbnail ni botón previo

EXP 5 ahora prioriza el arranque directo del YouTube Short preparado. El click real `REVELAR MENSAJE DE VEYRA` llama `revealWithSound()` en el orquestador; no se crea un player nuevo, no se espera a que cargue una imagen externa y no se muestra ningún botón previo distinto.

Comportamiento actual:

- `NEXT_PUBLIC_RESULT_YOUTUBE_POSTER_SHIELD_ENABLED` default `false`; no se renderiza thumbnail ni se genera URL de poster salvo que se active explícitamente con `true`.
- No hay pantalla de carga ni texto `Preparando mensaje...`.
- No existe fallback `REPRODUCIR MENSAJE DE VEYRA`; si falla la reproducción con sonido, reaparece `REVELAR MENSAJE DE VEYRA`.
- Deep links de EXP 5 intentan autoplay muted, no autoplay con sonido; si no llega `PLAYING` muted, muestran el botón tras timeout.
- El intro veil es una capa propia, sin imagen, `pointer-events: none`, con gradiente oscuro. Dura aprox. 3000ms, empieza a desvanecer a los 2100ms con fade de 900ms y usa opacidad default `0.92`.
- Bottom UI shield y top UI shield quedan apagados por defecto. Si se necesita volver a suavizar UI persistente, se activan por env.
- No cambia el framing: `fitMode="native"`, `iframeScale=1`, offsets `0`, sin crop vertical tipo Presto.

Variables nuevas o relevantes:

- `NEXT_PUBLIC_RESULT_YOUTUBE_POSTER_SHIELD_ENABLED`
- `NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_ENABLED`
- `NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_DURATION_MS`
- `NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_FADE_MS`
- `NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_OPACITY`
- `NEXT_PUBLIC_RESULT_YOUTUBE_BOTTOM_UI_SHIELD_ENABLED`
- `NEXT_PUBLIC_RESULT_YOUTUBE_TOP_UI_SHIELD_ENABLED`

## Ajustes visuales y prewarm en EXP 5

EXP 5 usa ajustes visuales separados de la VSL para evitar que el crop/máscaras pensados para el video de Janny deformen los Shorts de respuesta. Los defaults de resultado son específicos para Shorts: `fitMode="native"`, `iframeScale=1`, offsets `0`, máscaras de borde `0`, logo mask central apagada y sin barra simulada.

Variables de ajuste específicas de EXP 5:

- `NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_SCALE`
- `NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_OFFSET_X`
- `NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_OFFSET_Y`
- `NEXT_PUBLIC_RESULT_YOUTUBE_MASK_TOP`
- `NEXT_PUBLIC_RESULT_YOUTUBE_MASK_BOTTOM`
- `NEXT_PUBLIC_RESULT_YOUTUBE_MASK_LEFT`
- `NEXT_PUBLIC_RESULT_YOUTUBE_MASK_RIGHT`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_MODE`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_ENABLED`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_X`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_Y`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_WIDTH`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_HEIGHT`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_RADIUS`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_BLUR`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_OPACITY`
- `NEXT_PUBLIC_RESULT_VIDEO_FALLBACK_DURATION_SECONDS`

El player soporta offsets controlados y aplica el iframe con `position:absolute`, `inset:0`, `width/height/minWidth/minHeight:100%`. En el modo no-zoom de EXP 5 no se aplica transform cuando `iframeScale=1` y offsets `0`; el iframe ocupa el shell móvil sin wrapper 9:16 adicional ni crop agresivo.

Cuando EXP 4 detecta el patrón dominante, el orquestador prepara solo el Short correspondiente en el mismo player persistente que luego se revela. La preparación agrega `preconnect`/`dns-prefetch`, carga la YouTube IFrame API de forma idempotente, fuerza `allow="autoplay; encrypted-media; picture-in-picture; fullscreen"` en el iframe y arranca `loadVideoById` + `playVideo()` muted con volumen `0`. El click `REVELAR MENSAJE DE VEYRA` es el gesto que reinicia desde `0` y activa sonido en EXP 5.

## Prepared player y logo mask en EXP 5

La estrategia de precarga de EXP 5 se cambió de un prewarm oculto suelto a un prepared player persistente montado por `FunnelOrchestrator`. Cuando EXP 4 detecta el patrón dominante, el player real de resultado ya montado carga el video con `loadVideoById`, mutea, pone volumen `0` y ejecuta `playVideo()` para calentar el iframe con playback real. Al click `REVELAR MENSAJE DE VEYRA`, ese mismo player ejecuta `loadVideoById` o `seekTo(0, true)` según el estado, luego `unMute()`, `setVolume(100)` y `playVideo()`, evitando crear un iframe nuevo al entrar a EXP 5.

EXP 5 ya no monta `YouTubeShortsVslPlayer`; ahora funciona como capa de overlays, bridge y CTA sobre `PreparedYouTubeResultPlayer`. Esto evita doble iframe, doble audio y pérdida de preparación entre EXP 4 y EXP 5. El helper `prewarmYouTubeShort` queda limitado a preconnect/dns-prefetch/carga de API.

La máscara radial de logo queda disponible solo como herramienta de diagnóstico o ajuste manual. Para ocultar visualmente la UI/marca `Shorts`, el result player usa por defecto solo el intro veil temporal, sin poster ni shields persistentes. La máscara central se puede activar explícitamente con:

- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_ENABLED`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_X`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_Y`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_WIDTH`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_HEIGHT`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_RADIUS`

Los defaults actuales de resultado son `iframeScale=1`, offsets `0`, máscaras de borde `0`, logo mask `off`, bottom UI shield `false`, top UI shield `false`, poster shield `false` e intro veil `true`. El iframe queda dentro del shell móvil centrado (`max-width` aprox. `460px`) y no usa `fixed`, `w-screen`, `h-screen` ni `100vw`.

## EXP 5 no-zoom mode

EXP 5 desactivó el zoom por defecto para probar los YouTube Shorts en escala real. El result player usa `fitMode="native"`, `verticalMode={true}`, `NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_SCALE=1`, `NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_OFFSET_X=0` y `NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_OFFSET_Y=0`.

El iframe se monta como `absolute inset-0 h-full w-full` dentro del shell mobile-first. Si no hay env explícito de escala u offset, no se aplica `transform`, no se agranda el iframe y no se usa crop agresivo para ocultar partes de YouTube.

Cualquier ocultamiento visual futuro debe hacerse con overlays suaves, gradientes o soft masks encima del video. No se debe resolver logo/UI con zoom/crop que corte rostro, cuerpo o elementos importantes. Para probar sin máscara de logo: `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_MODE=off`.

## Soft logo mask en EXP 5

La primera máscara de logo era demasiado sólida y podía verse como un recuadro negro en medio del video. Se reemplazó por una soft logo mask con `radial-gradient` elíptico, feather por `mask-image`, `backdrop-filter` con blur/saturación/brillo y tamaño reducido. El objetivo es disimular la marca/UI `Shorts` sin que el parche parezca un bloque.

La máscara es configurable por env:

- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_MODE=soft`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_MODE=off`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_BLUR=14`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_OPACITY=0.22`

El modo `solid` queda como opción de diagnóstico. EXP 5 ya no usa `soft` por defecto; el default es `off` para evitar cualquier mancha o recuadro central.

## Auditoría Presto — ocultamiento UI YouTube

Auditoría local revisada en:

- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player/`
- `/home/soy.grandiosamujer.com/public_html/wp-content/plugins/presto-player-pro/`

Hallazgos reales:

- Presto usa Plyr para YouTube. El componente `presto-youtube` renderiza `.plyr__video-embed` con `data-plyr-provider="youtube"` y `data-plyr-embed-id`.
- Presto configura YouTube con `rel: 0`, `showinfo: 0`, `iv_load_policy: 3`, `modestbranding: 1`, `customControls: true` y `playsinline`.
- Presto sí usa poster. Si no hay poster explícito, intenta obtener thumbnail de YouTube en orden `maxresdefault`, `sddefault`, `hqdefault` y asignarlo a `player.poster`.
- El poster de Plyr queda encima del video cuando el player está detenido (`.plyr--stopped.plyr__poster-enabled .plyr__poster { opacity: 1; }`). Por eso un ejemplo "sin logo" puede estar mostrando poster, no el iframe activo.
- Presto sí tiene CSS específico `.presto-player__wrapper.hide-youtube-ui .plyr__video-embed iframe { top: -50%; height: 200%; }`.
- Ese `hide-youtube-ui` es un hack de crop/overscan vertical, no un API oficial de YouTube. El propio CSS comenta que funciona solo cuando el contenedor mantiene aspect ratio fijo.
- Presto también usa el wrapper de Plyr con `overflow: hidden`; en modo full UI Plyr usa un contenedor interno con `padding-bottom: 240%` y `transform: translateY(-38.28125%)`.
- No se encontró un patrón equivalente de `pointer-events: none` aplicado al iframe de YouTube; el `pointer-events: none` explícito encontrado para providers apunta a Vimeo en estado playing y a elementos UI/preview de Plyr.
- No se encontró en Pro una estrategia adicional relevante para ocultar la UI de YouTube.
- La combinación que más reduce logo/UI en Presto es: controles nativos ocultos por params/Plyr, custom controls propios, poster/thumbnail sobre el iframe antes de reproducir, wrapper con overflow hidden y, si se activa `hide_youtube`, crop vertical del iframe.

Qué replicamos en Veyra sin copiar código propietario:

- Mantener `controls=0`, `disablekb=1`, `iv_load_policy=3`, `modestbranding=1`, `playsinline=1`, `rel=0`.
- Mantener poster shield como opción explícita, pero apagado por defecto para que EXP 5 no muestre thumbnail ni espere imágenes externas.
- Poner `pointer-events: none` al iframe y un blocker transparente encima para que taps/clicks no despierten UI interna de YouTube.
- Usar un intro veil propio de 3 segundos para suavizar el arranque sin bloquear reproducción.
- No replicar por defecto el hack Presto `top:-50%; height:200%`, porque en Shorts de EXP 5 sería crop/zoom agresivo y puede cortar rostro o elementos importantes.

## Ajuste Veyra — sin máscara central

EXP 5 ya no usa máscara central por defecto. `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_MODE` sigue existiendo para diagnóstico, pero el default recomendado es `off`.

El ocultamiento principal durante el arranque ahora se maneja con un intro veil temporal: un gradiente propio, sin thumbnail, sin texto y sin bloquear interacción. Defaults:

- `NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_ENABLED=true`
- `NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_DURATION_MS=3000`
- `NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_FADE_MS=900`
- `NEXT_PUBLIC_RESULT_YOUTUBE_INTRO_VEIL_OPACITY=0.92`

Bottom/top shields quedan disponibles, pero apagados por defecto:

- `NEXT_PUBLIC_RESULT_YOUTUBE_BOTTOM_UI_SHIELD_ENABLED=false`
- `NEXT_PUBLIC_RESULT_YOUTUBE_BOTTOM_UI_SHIELD_HEIGHT=150`
- `NEXT_PUBLIC_RESULT_YOUTUBE_BOTTOM_UI_SHIELD_OPACITY=0.82`
- `NEXT_PUBLIC_RESULT_YOUTUBE_TOP_UI_SHIELD_ENABLED=false`
- `NEXT_PUBLIC_RESULT_YOUTUBE_TOP_UI_SHIELD_HEIGHT=96`
- `NEXT_PUBLIC_RESULT_YOUTUBE_TOP_UI_SHIELD_OPACITY=0.45`

Poster shield queda disponible solo como opt-in:

- `NEXT_PUBLIC_RESULT_YOUTUBE_POSTER_SHIELD_ENABLED=false`

El iframe queda con `pointer-events: none` y el player mantiene un blocker transparente por encima. El botón único `REVELAR MENSAJE DE VEYRA` y el bridge/CTA están en capas superiores; si el intento falla, reaparece el mismo botón de revelación. No hay zoom por defecto: `fitMode="native"`, `iframeScale=1`, offsets `0`.

## Fix EXP 5 — robust reveal over YouTube iframe

EXP 5 ya no depende únicamente de `onReady` ni de que muted autoplay confirme `PLAYING`. El prepared player intenta un pre-roll muted real con `loadVideoById`, `mute()`, `setVolume(0)` y `playVideo()`, hace un retry muted a los 800ms, y si no recibe `PLAYING` en aprox. 2800ms marca el player como listo en modo manual para mostrar `REVELAR MENSAJE DE VEYRA`.

El iframe se parchea al estar listo y en cada cambio de estado con `allow="autoplay; encrypted-media; picture-in-picture; fullscreen"`, `allowfullscreen="false"`, dimensiones absolutas al 100% y `pointer-events: none`. El blocker transparente queda sobre el iframe, el velo oscuro cubre la UI interna inicial de YouTube, y el botón propio vive en una capa superior para recibir el click.

`revealWithSound()` ahora revisa el estado del player: si está `UNSTARTED`, `CUED`, `PAUSED`, `ENDED` o sin estado confiable, recarga desde `0` con `loadVideoById`; si ya está reproduciendo/bufferizando, hace `seekTo(0, true)`. Después siempre ejecuta `unMute()`, `setVolume(100)` y `playVideo()`. Si no llega a `PLAYING` con sonido en 4000ms, reaparece el mismo botón de reveal.
