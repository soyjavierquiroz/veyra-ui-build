# Enlaces directos a escenas

Los enlaces directos usan query params sobre `/`. No crean rutas nuevas ni muestran un panel visible.

## Flujo principal actual

Landing
→ EXP 1 video llamada entrante
→ EXP 2 llamada Veyra
→ EXP 3 scanner
→ EXP 4 quiz
→ EXP 5 lectura/respuesta MP4
→ VSL
→ Oferta real en dominio principal

- La VSL es la última experiencia antes de la Oferta.
- EXP 6/7/8/9/11 quedan fuera del flujo principal.
- YouTube sigue fuera del runtime activo.
- EXP 5 usa MP4 local versionado con `versionAsset()`.
- La Oferta activa está en el repo principal; `exp10-offer` queda legacy/manual.

## Deep links principales

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
- https://mnle.reconociendotupoder.com/?scene=vsl-interlude
- https://mnle.reconociendotupoder.com/?scene=exp10-offer

## Deep links legacy de auditoria

Estos enlaces siguen disponibles para revision manual, pero no pertenecen al flujo principal ni son destinos de transiciones activas entre EXP 5, VSL y Oferta.

- https://mnle.reconociendotupoder.com/?scene=exp6-portal
- https://mnle.reconociendotupoder.com/?scene=exp7-whatsapp-hook
- https://mnle.reconociendotupoder.com/?scene=exp8-login
- https://mnle.reconociendotupoder.com/?scene=exp9-feed
- https://mnle.reconociendotupoder.com/?scene=exp11-whatsapp-op

Los deep links no garantizan autoplay con audio. Las escenas con audio pueden requerir gesto del usuario; EXP 5 espera ese gesto con el botón único sobre el player preparado.

## Asset versioning / cache busting

- Los assets públicos de audio/video/images del funnel se cargan con el `basePath` del build y `?v=<NEXT_PUBLIC_ASSET_VERSION>`.
- Esto evita caché vieja de Cloudflare/navegador cuando se reemplazan MP3/MP4 con el mismo nombre.
- Versión actual: `ed12a5d`.
- Si se cambian assets, actualizar `NEXT_PUBLIC_ASSET_VERSION` o el fallback en `components/funnel/asset-version.ts`.

## EXP 3 Scanner + Revelación de Veyra

- Link directo: https://mnle.reconociendotupoder.com/?scene=exp3-scanner
- Abre EXP 3 en idle, sin audio automático.
- El audio inicia únicamente al presionar la huella.
- La UI del scanner usa `audio.currentTime` como reloj maestro.
- Si el audio se pausa, espera o stallea, los pasos visuales no avanzan solos.
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
- Al detectar el patrón dominante, pasa automáticamente a EXP 5.
- EXP 4 ya no muestra botón `REVELAR MENSAJE DE VEYRA`.
- El botón `REVELAR MENSAJE DE VEYRA` vive solo en EXP 5, encima del player preparado.
- Loop ambiental: `/audio/loop-quiz.mp3` con volumen objetivo `0.4`.
- Los audios principales usan Web Audio API con preload/decoding para reducir retrasos de reproducción.
- Audio principal de intro/P1: `/audio/quiz-p1-final.mp3`, inicia al presionar `CRUZAR EL UMBRAL`.
- Audio principal de Pregunta 2: `/audio/quiz-p2-final.mp3`, inicia después de responder la Pregunta 1.
- Audio principal de Pregunta 3: `/audio/quiz-p3-final.mp3`, inicia después de responder la Pregunta 2.
- Audio principal de Pregunta 4: `/audio/quiz-p4-final.mp3`, inicia después de responder la Pregunta 3.
- Audio principal de Pregunta 5: `/audio/quiz-p5-final.mp3`, inicia después de responder la Pregunta 4.
- Audio final de última elección: `/audio/quiz-p6-final.mp3`, inicia cuando la visitante responde la Pregunta 5.
- `/audio/quiz-p6-final.mp3` se precarga junto con p1-p5 y corresponde a la última elección del quiz.
- Al responder la Pregunta 5, el audio primario anterior se detiene/reset antes de reproducir p6 para evitar solapes.
- El loop y el audio principal inicial inician en el flujo real al presionar `CRUZAR EL UMBRAL`.
- Por deep link no se fuerza autoplay.
- Al entrar automáticamente a EXP 5, `loop-quiz.mp3` y `quiz-p6-final.mp3` mantienen continuidad.
- Al presionar `REVELAR MENSAJE DE VEYRA` en EXP 5, `loop-quiz.mp3` y `quiz-p6-final.mp3` hacen fade out antes de detenerse.

## EXP 5 Mensaje Personalizado de Veyra

- YouTube fue removido del runtime activo del funnel.
- EXP 5 usa un `<video>` MP4 local por patrón, sin iframe, sin YouTube IFrame API y sin Shorts.
- El video se monta como fondo full-screen dentro del shell mobile-first.
- Default visual: `object-fit: cover`, sin zoom manual, sin transforms y sin crop agresivo adicional.
- Puede probarse `contain` con `NEXT_PUBLIC_RESULT_VIDEO_OBJECT_FIT=contain` si un asset recorta demasiado.
- Cuando EXP 4 detecta el patrón dominante, solo precarga el MP4 correspondiente mediante `<link rel="preload" as="video">` y `video.load()`.
- No se precargan los 6 videos.
- El botón único previo al video es `REVELAR MENSAJE DE VEYRA`.
- El botón aparece cuando el MP4 emite `loadeddata`/`canplay`.
- No existe botón `REPRODUCIR MENSAJE DE VEYRA` en EXP 5.
- Al click real sobre `REVELAR MENSAJE DE VEYRA`, el MP4 se reinicia desde `0`, se reproduce con audio integrado y el botón se oculta.
- Si la reproducción falla, reaparece el mismo botón `REVELAR MENSAJE DE VEYRA`.
- Antes del click, el overlay oscuro/místico cubre el player y mantiene la experiencia preparada.
- Después del click, el overlay permanece 3s y desvanece con fade de 900ms.
- Al click, `loop-quiz.mp3` hace fade out de 800ms y `quiz-p6-final.mp3` hace fade out de 600ms si sigue sonando.
- Al click, inicia `/audio/loop-result.mp3` con fade in de 800ms y volumen objetivo `0.18`.
- El loop de resultado se detiene y resetea cuando la usuaria presiona `ABRIR EL CAMINO HACIA JANNY`.
- El loop de resultado no sigue sonando en VSL.
- Al terminar el MP4, por evento `ended` o fallback de `timeupdate`, muestra bridge por patrón y CTA: `ABRIR EL CAMINO HACIA JANNY`.
- En el flujo principal ese CTA lleva directo a la VSL full-screen, sin pasar por EXP 6.
- EXP 5 acepta `pattern`. Si se abre `?scene=exp5-reading` sin pattern, usa `abandono`.

Variables de ajuste EXP 5:

- `NEXT_PUBLIC_RESULT_VIDEO_OBJECT_FIT=cover|contain`, default `cover`
- `NEXT_PUBLIC_RESULT_INTRO_VEIL_DURATION_MS`, default `3000`
- `NEXT_PUBLIC_RESULT_INTRO_VEIL_FADE_MS`, default `900`
- `NEXT_PUBLIC_RESULT_VIDEO_FALLBACK_DURATION_SECONDS` default `65`

Mapeo:

- Respuesta 1 → `abandono` → `MIEDO A QUE TE OLVIDE` → `/videos/resp1-veyra-final.mp4`
- Respuesta 2 → `validacion` → `BÚSQUEDA DE VALIDACIÓN` → `/videos/resp2-veyra-final.mp4`
- Respuesta 3 → `cierre` → `NECESIDAD DE CIERRE` → `/videos/resp3-veyra-final.mp4`
- Respuesta 4 → `culpa` → `CULPA POR ALEJARTE` → `/videos/resp4-veyra-final.mp4`
- Respuesta 5 → `nostalgia` → `NOSTALGIA POR LO BONITO` → `/videos/resp5-veyra-final.mp4`
- Respuesta 6 → `ansiedad-silencio` → `ANSIEDAD POR SILENCIO` → `/videos/resp6-veyra-final.mp4`

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
- Al terminar la VSL, el flujo hace handoff a la oferta real en el dominio principal.
- En orgánico navega a `/o/no-le-escribas`.
- En ads navega a `/x9m/o/no-le-escribas`.
- Antes del handoff guarda `rtp_funnel_context_v1` en `localStorage`.
- `exp10-offer` no es destino del flujo principal.
- No pasa por portal, WhatsApp hook, login, feed ni operación WhatsApp antes de mostrar la Oferta.
- La VSL activa usa Bunny/HLS mediante `VslVideoPlayer`.
- La ruta YouTube de VSL fue retirada del runtime activo para evitar iframe/autoplay inestable en móviles.
- Configuración:
  `NEXT_PUBLIC_VSL_VIDEO_URL=https://vz-.../playlist.m3u8`
- El provider Bunny usa un player Panda-style adaptado desde:
  `/home/sensorial.pameflorescrea.com/source_boilerplate/src/components/themes/expert/components/video-player`
- El README fuente indica Bunny.net como stream HLS `.m3u8` sobre `<video>` nativo con `hls.js`, modo VSL, autoplay, UI limpia y barra de progreso psicológico.
- En Veyra el player vive en `components/funnel/video-player/vsl-video-player.tsx`.
- La URL se lee desde `NEXT_PUBLIC_VSL_VIDEO_URL` vía `funnelConfig.vslVideoUrl`.
- Si `NEXT_PUBLIC_VSL_VIDEO_URL` no existe o está vacía, usa la URL temporal Bunny:
  `https://vz-febf8c0d-fb8.b-cdn.net/1924db19-affb-41ea-a457-4195d85671c6/playlist.m3u8`
- Para cambiar el video luego, definir `NEXT_PUBLIC_VSL_VIDEO_URL` o actualizar `TEMPORARY_BUNNY_VSL_URL` en `components/funnel/config.ts`.
- El player intenta autoplay con audio al montar después del click real en `ABRIR EL CAMINO HACIA JANNY`.
- Si el navegador bloquea la reproducción/autoplay, muestra el fallback: `REPRODUCIR MENSAJE DE JANNY`.
- No muestra pantalla previa, header `EXP 7`, card, placeholder ni botón `Continuar` antes del video.
- La VSL se muestra full-screen mobile-first sobre fondo negro.
- En móvil ocupa 100dvh y 100% del ancho del dispositivo, sin card, bordes ni márgenes.
- En desktop respeta el shell móvil centrado del funnel (`max-width` aprox. 460px) y no se expande a todo el ancho de la ventana.
- No muestra controles nativos.
- Bloquea clicks/acciones sobre el video con `pointer-events: none` y overlay transparente.
- Muestra una barra de avance simulada superpuesta abajo, no manipulable por la usuaria.

## EXP 10 Oferta

- Deep link: https://mnle.reconociendotupoder.com/?scene=exp10-offer
- Es una escena legacy/manual y ya no es la escena posterior directa a la VSL en el flujo principal.
- Los CTAs de compra/duda abren la ruta `/whatsapp/` con el modo correspondiente.
- La operación WhatsApp no es una experiencia obligatoria antes de ver la Oferta.

## Escenas legacy fuera del flujo principal

- `exp6-portal`, `exp7-whatsapp-hook`, `exp8-login`, `exp9-feed` y `exp11-whatsapp-op` siguen disponibles solo por deep link de auditoria o por la ruta standalone `/whatsapp/` cuando aplica.
- Ninguna de estas escenas se usa entre EXP 5 y VSL.
- Ninguna de estas escenas se usa entre VSL y Oferta.

## Same-domain publishing MNLE

Rutas planeadas:

Orgánico:
https://reconociendotupoder.com/fi/mnle

Ads:
https://reconociendotupoder.com/x9m/fi/mnle

Legacy temporal:
https://mnle.reconociendotupoder.com

Reglas:

- `/fi/mnle` no activa Pixel/CAPI/TikTok.
- `/x9m/fi/mnle` puede activar tracking ads sólo por estar bajo `/x9m`.
- fbclid/UTMs no activan tracking fuera de `/x9m`.
- VSL ya no debe ir a `exp10-offer` interno como flujo principal.
- VSL debe hacer handoff a la oferta real:
  - orgánico: `/o/no-le-escribas`
  - ads: `/x9m/o/no-le-escribas`
- Antes del handoff se guarda `rtp_funnel_context_v1`.
- `exp10-offer` queda legacy/manual si existe.
- No se dispara Lead/CompleteRegistration/InitiateCheckout/Purchase desde el funnel.
- Los assets públicos se sirven bajo el basePath del build:
  - `/fi/mnle/audio`, `/fi/mnle/videos`, `/fi/mnle/images`
  - `/x9m/fi/mnle/audio`, `/x9m/fi/mnle/videos`, `/x9m/fi/mnle/images`

Recordatorio:

Todo deploy futuro del repo oferta debe excluir:

- `/fi/`
- `/x9m/fi/`
