# Enlaces directos a escenas

Los enlaces directos usan query params sobre `/`. No crean rutas nuevas ni muestran un panel visible.

- https://mnle.reconociendotupoder.com/?scene=landing
- https://mnle.reconociendotupoder.com/?scene=exp1-video
- https://mnle.reconociendotupoder.com/?scene=exp2-call
- https://mnle.reconociendotupoder.com/?scene=exp3-scanner
- https://mnle.reconociendotupoder.com/?scene=exp4-quiz
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=abandono
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=validacion
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=cierre
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=culpa
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=nostalgia
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=ansiedad-silencio
- https://mnle.reconociendotupoder.com/?scene=exp6-portal
- https://mnle.reconociendotupoder.com/?scene=vsl-interlude
- https://mnle.reconociendotupoder.com/?scene=exp7-whatsapp-hook
- https://mnle.reconociendotupoder.com/?scene=exp8-login
- https://mnle.reconociendotupoder.com/?scene=exp9-feed
- https://mnle.reconociendotupoder.com/?scene=exp10-offer
- https://mnle.reconociendotupoder.com/?scene=exp11-whatsapp-op

Los deep links no garantizan autoplay con audio. Las escenas con audio pueden requerir gesto del usuario y mostrar fallback si el navegador bloquea la reproducción.

## EXP 3 Scanner + Revelación de Veyra

- Link directo: https://mnle.reconociendotupoder.com/?scene=exp3-scanner
- Abre EXP 3 en idle, sin audio automático.
- El audio inicia únicamente al presionar la huella.
- El scanner técnico llega a 100% a los 20.2s aprox.
- El scanner desaparece durante la transferencia 20.2s-23.8s.
- El video de Veyra inicia a los 21.8s aprox. desde `currentTime = 0`.
- Veyra queda revelada a los 23.8s aprox.; el video no se reinicia ahí.
- El video no usa loop; al terminar queda el poster/fallback como espera visual.
- El CTA aparece desde 64.5s aprox.
- CTA final: `CRUZAR EL UMBRAL`.
- Video: `/videos/veyra-scanner-reveal.mp4`
- Audio: `/audio/scanner-veyra-reveal-final.mp3`
- Poster/fallback: `/images/veyra-scanner-reveal-poster.webp`

## EXP 4 Evaluación de Acceso

- Link directo: https://mnle.reconociendotupoder.com/?scene=exp4-quiz
- Abre la Evaluación de Acceso con una intro mística automática.
- Ya no muestra botón `Empezar lectura`.
- La intro dura aprox. 22.5s y avanza automáticamente a la Pregunta 1.
- La primera interacción de la usuaria es elegir una respuesta.
- El feedback después de responder queda visible antes de avanzar.
- Después de Pregunta 5, calcula patrón dominante.
- Muestra:
  - `Lectura lista.`
  - `Tu patrón dominante fue detectado.`
  - `Veyra tiene un mensaje para ti.`
- Botón: `REVELAR MENSAJE DE VEYRA`.
- Ese botón lleva a EXP 5, inicia el loop ambiental de resultado y dispara el video personalizado.
- Loop ambiental: `/audio/loop-quiz.mp3` con volumen objetivo `0.4`.
- Los audios principales usan Web Audio API con preload/decoding para reducir retrasos de reproducción.
- Audio principal de intro/P1: `/audio/quiz-p1-final.mp3`, inicia al presionar `CRUZAR EL UMBRAL`.
- Audio principal de Pregunta 2: `/audio/quiz-p2-final.mp3`, inicia después de responder la Pregunta 1.
- Audio principal de Pregunta 3: `/audio/quiz-p3-final.mp3`, inicia después de responder la Pregunta 2.
- Audio principal de Pregunta 4: `/audio/quiz-p4-final.mp3`, inicia después de responder la Pregunta 3.
- Audio principal de Pregunta 5: `/audio/quiz-p5-final.mp3`, inicia después de responder la Pregunta 4.
- El loop y el audio principal inicial inician en el flujo real al presionar `CRUZAR EL UMBRAL`.
- Por deep link no se fuerza autoplay.
- Al responder la Pregunta 5, el audio principal se detiene/reset si sigue activo.
- El loop ambiental se detiene antes de entrar a EXP 5; el audio principal también se resetea por seguridad.

## EXP 5 Mensaje Personalizado de Veyra

- Reproduce un YouTube Short personalizado según patrón dominante.
- Los Shorts personalizados se reproducen como fondo full-screen de la escena.
- El texto del patrón, bridge y CTA aparecen superpuestos sobre el video.
- No se muestra como embed normal, tarjeta, header externo, marco ni bloque con márgenes.
- Cada video incluye audio integrado.
- Intenta autoplay con sonido inmediatamente después del click `REVELAR MENSAJE DE VEYRA`.
- Si el navegador bloquea autoplay por no tener gesto válido, muestra el fallback: `REPRODUCIR MENSAJE DE VEYRA`.
- Usa el prepared YouTube result player en modo no-zoom por defecto, con controles ocultos, shields suaves y overlay transparente para bloquear interacción.
- Usa un prepared YouTube result player persistente montado desde el orquestador.
- Cuando EXP 4 detecta el patrón dominante, el mismo player persistente se prepara con el Short correcto mediante preconnect/dns-prefetch, YouTube IFrame API y `cueVideoById`, sin autoplay ni audio.
- Al presionar `REVELAR MENSAJE DE VEYRA`, no se crea otro iframe: se revela ese mismo player preparado y se llama `unMute()`, `setVolume(100)` y `playVideo()`.
- Usa ajustes visuales separados de la VSL: `fitMode="native"`, escala `1`, offsets `0`, máscaras de borde `0` y logo mask central apagada por defecto.
- El ocultamiento visual se hace con gradientes/overlays/masks suaves encima del video, no con zoom agresivo ni crop para sacar elementos del cuadro.
- La UI inferior/logo `Shorts` se disimula con un bottom UI shield configurable: gradiente inferior, no bloque sólido ni parche central.
- Se agregó top UI shield opcional para suavizar título/avatar superior sin tapar el centro del video.
- Se agregó poster shield opcional con thumbnail de YouTube para evitar flashes iniciales de UI/logo antes de confirmar reproducción.
- El iframe de YouTube usa `pointer-events: none`.
- Hay un blocker transparente encima del video para evitar que taps/clicks activen la UI interna de YouTube; fallback y bridge/CTA quedan en capas superiores.
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_MODE` sigue existiendo para diagnóstico, pero el default ahora es `off`.
- En móvil ocupa toda la pantalla disponible del dispositivo dentro de `100dvh`.
- En desktop respeta el shell móvil centrado del funnel (`max-width` aprox. 460px) y no se abre a todo el ancho de la ventana.
- Usa audio ambiental de resultado: `/audio/loop-result.mp3`.
- El loop de resultado inicia cuando la usuaria presiona `REVELAR MENSAJE DE VEYRA`.
- El loop suena debajo del video personalizado de Veyra.
- Volumen objetivo del loop de resultado: `0.15`.
- El loop se mantiene activo durante EXP 5.
- El loop se detiene y resetea cuando la usuaria presiona `ABRIR EL CAMINO HACIA JANNY`.
- El loop no sigue sonando en VSL.
- Por deep link no se fuerza autoplay del loop de resultado.
- No usa audios separados de resultado.
- No usa video base común.
- Al terminar el video muestra bridge por patrón y CTA: `ABRIR EL CAMINO HACIA JANNY`.
- Si YouTube no emite `ended`, EXP 5 muestra el bridge por fallback de duración.
- En el flujo principal ese CTA lleva directo a la VSL full-screen, sin pasar por EXP 6.
- Los MP4 locales `resp*-veyra-final.mp4` ya no son la fuente principal de EXP 5.
- EXP 5 acepta `pattern`. Si se abre `?scene=exp5-reading` sin pattern, usa `abandono`.

Variables de ajuste EXP 5:

- `NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_SCALE` default `1`
- `NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_OFFSET_X` default `0`
- `NEXT_PUBLIC_RESULT_YOUTUBE_IFRAME_OFFSET_Y` default `0`
- `NEXT_PUBLIC_RESULT_YOUTUBE_MASK_TOP` default `0`
- `NEXT_PUBLIC_RESULT_YOUTUBE_MASK_BOTTOM` default `0`
- `NEXT_PUBLIC_RESULT_YOUTUBE_MASK_LEFT` default `0`
- `NEXT_PUBLIC_RESULT_YOUTUBE_MASK_RIGHT` default `0`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_MODE` default `off`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_ENABLED` default activo
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_X` default `50`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_Y` default `49`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_WIDTH` default `132`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_HEIGHT` default `44`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_RADIUS` default `999`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_BLUR` default `14`
- `NEXT_PUBLIC_RESULT_YOUTUBE_LOGO_MASK_OPACITY` default `0.22`
- `NEXT_PUBLIC_RESULT_YOUTUBE_BOTTOM_UI_SHIELD_ENABLED` default `true`
- `NEXT_PUBLIC_RESULT_YOUTUBE_BOTTOM_UI_SHIELD_HEIGHT` default `150`
- `NEXT_PUBLIC_RESULT_YOUTUBE_BOTTOM_UI_SHIELD_OPACITY` default `0.82`
- `NEXT_PUBLIC_RESULT_YOUTUBE_TOP_UI_SHIELD_ENABLED` default `true`
- `NEXT_PUBLIC_RESULT_YOUTUBE_TOP_UI_SHIELD_HEIGHT` default `96`
- `NEXT_PUBLIC_RESULT_YOUTUBE_TOP_UI_SHIELD_OPACITY` default `0.45`
- `NEXT_PUBLIC_RESULT_YOUTUBE_POSTER_SHIELD_ENABLED` default `true`
- `NEXT_PUBLIC_RESULT_VIDEO_FALLBACK_DURATION_SECONDS` default `65`

Mapeo:

- Respuesta 1 → `abandono` → `MIEDO A QUE TE OLVIDE` → https://www.youtube.com/shorts/rKRWUiWTI3A
- Respuesta 2 → `validacion` → `BÚSQUEDA DE VALIDACIÓN` → https://www.youtube.com/shorts/lHGOaV-hfEs
- Respuesta 3 → `cierre` → `NECESIDAD DE CIERRE` → https://www.youtube.com/shorts/Yd-2MW9zMDo
- Respuesta 4 → `culpa` → `CULPA POR ALEJARTE` → https://www.youtube.com/shorts/92IEKoTjs64
- Respuesta 5 → `nostalgia` → `NOSTALGIA POR LO BONITO` → https://www.youtube.com/shorts/rKRWUiWTI3A
- Respuesta 6 → `ansiedad-silencio` → `ANSIEDAD POR SILENCIO` → https://www.youtube.com/shorts/3OZyBOh6jGg

Deep links:

- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=abandono
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=validacion
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=cierre
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=culpa
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=nostalgia
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=ansiedad-silencio

## EXP 6 Portal Privado de Lectura Revelada

- Deep link: https://mnle.reconociendotupoder.com/?scene=exp6-portal
- Sigue disponible por deep link para revisión/manual.
- Ya no forma parte del flujo principal.
- Copy:
  - `Portal Privado de Lectura Revelada`
  - `Patrón dominante revelado.`
  - `Guía humana asignada: Janny Helguero.`
  - `Veyra reveló.`
  - `Janny ordena.`
- Botón: `VER MENSAJE DE JANNY`
- El botón lleva directamente a la VSL en `?scene=vsl-interlude`.

## VSL / Mensaje de Janny

- Deep link: https://mnle.reconociendotupoder.com/?scene=vsl-interlude
- Flujo principal: `EXP 5` → `ABRIR EL CAMINO HACIA JANNY` → VSL full-screen mobile-first.
- La VSL soporta provider `bunny` o `youtube` vía `funnelConfig.vslProvider`.
- Por defecto usa `bunny` si `NEXT_PUBLIC_VSL_PROVIDER` no es `youtube`.
- Bunny se mantiene con:
  `NEXT_PUBLIC_VSL_PROVIDER=bunny`
  `NEXT_PUBLIC_VSL_VIDEO_URL=https://vz-.../playlist.m3u8`
- YouTube Shorts se configura con:
  `NEXT_PUBLIC_VSL_PROVIDER=youtube`
  `NEXT_PUBLIC_VSL_YOUTUBE_URL=https://www.youtube.com/shorts/{id}`
- Si `provider=youtube` y no hay URL válida, muestra `Short de YouTube pendiente de configuración.`
- El provider Bunny usa un player Panda-style adaptado desde:
  `/home/sensorial.pameflorescrea.com/source_boilerplate/src/components/themes/expert/components/video-player`
- El README fuente indica Bunny.net como stream HLS `.m3u8` sobre `<video>` nativo con `hls.js`, modo VSL, autoplay, UI limpia y barra de progreso psicológico.
- En Veyra el player vive en `components/funnel/video-player/vsl-video-player.tsx`.
- La URL se lee desde `NEXT_PUBLIC_VSL_VIDEO_URL` vía `funnelConfig.vslVideoUrl`.
- Si `NEXT_PUBLIC_VSL_VIDEO_URL` no existe o está vacía, usa la URL temporal Bunny:
  `https://vz-febf8c0d-fb8.b-cdn.net/1924db19-affb-41ea-a457-4195d85671c6/playlist.m3u8`
- Para cambiar el video luego, definir `NEXT_PUBLIC_VSL_VIDEO_URL` o actualizar `TEMPORARY_BUNNY_VSL_URL` en `components/funnel/config.ts`.
- El provider YouTube vive en `components/funnel/video-player/youtube-shorts-vsl-player.tsx`.
- El player YouTube extrae `videoId` desde URLs `shorts`, `youtu.be`, `watch?v=`, `embed`, `/v/` o ID directo.
- YouTube usa IFrame API client-side y modo clean experimental:
  `controls=0`, `disablekb=1`, `playsinline=1`, `rel=0`, `fs=0`, `iv_load_policy=3`, `enablejsapi=1`.
- El modo clean agrega overlay blocker, crop/scale del iframe, máscaras visuales, gradientes propios y barra simulada.
- Variables de ajuste YouTube:
  `NEXT_PUBLIC_YOUTUBE_CLEAN_MODE`
  `NEXT_PUBLIC_YOUTUBE_IFRAME_SCALE`
  `NEXT_PUBLIC_YOUTUBE_MASK_TOP`
  `NEXT_PUBLIC_YOUTUBE_MASK_BOTTOM`
  `NEXT_PUBLIC_YOUTUBE_MASK_LEFT`
  `NEXT_PUBLIC_YOUTUBE_MASK_RIGHT`
- Defaults YouTube: clean mode activo, iframe scale `1.12`, mask bottom `82px`, top/left/right `0px`.
- El player intenta autoplay con audio al montar después del click real en `ABRIR EL CAMINO HACIA JANNY`.
- Si el navegador bloquea la reproducción/autoplay, muestra el fallback: `REPRODUCIR MENSAJE DE JANNY`.
- No muestra pantalla previa, header `EXP 7`, card, placeholder ni botón `Continuar` antes del video.
- La VSL se muestra full-screen mobile-first sobre fondo negro.
- En móvil ocupa 100dvh y 100% del ancho del dispositivo, sin card, bordes ni márgenes.
- En desktop respeta el shell móvil centrado del funnel (`max-width` aprox. 460px) y no se expande a todo el ancho de la ventana.
- No muestra controles nativos.
- Bloquea clicks/acciones sobre el video con `pointer-events: none` y overlay transparente.
- Muestra una barra de avance simulada superpuesta abajo, no manipulable por la usuaria.
