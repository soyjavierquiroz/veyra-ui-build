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

Los deep links no activan autoplay. Las escenas con audio requieren gesto del usuario.

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
- Ese botón lleva a EXP 5 e inicia el video personalizado.
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

- Reproduce un video personalizado según patrón dominante.
- Los videos personalizados se reproducen como fondo full-screen de la escena.
- El texto del patrón, bridge y CTA aparecen superpuestos sobre el video.
- No se muestra como tarjeta embebida.
- Cada video incluye audio integrado.
- No usa audios separados de resultado.
- No usa video base común.
- Al terminar el video muestra bridge por patrón y CTA: `ABRIR EL CAMINO HACIA JANNY`.
- Mantiene fallback si `play()` falla o si video no carga; si `play()` falla, muestra el botón de recuperación: `REVELAR MENSAJE DE VEYRA`.
- EXP 5 acepta `pattern`. Si se abre `?scene=exp5-reading` sin pattern, usa `abandono`.

Mapeo:

- `resp1-veyra-final.mp4` → `abandono` → `MIEDO A QUE TE OLVIDE`
- `resp2-veyra-final.mp4` → `validacion` → `BÚSQUEDA DE VALIDACIÓN`
- `resp3-veyra-final.mp4` → `cierre` → `NECESIDAD DE CIERRE`
- `resp4-veyra-final.mp4` → `culpa` → `CULPA POR ALEJARTE`
- `resp5-veyra-final.mp4` → `nostalgia` → `NOSTALGIA POR LO BONITO`
- `resp6-veyra-final.mp4` → `ansiedad-silencio` → `ANSIEDAD POR SILENCIO`

Deep links:

- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=abandono
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=validacion
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=cierre
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=culpa
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=nostalgia
- https://mnle.reconociendotupoder.com/?scene=exp5-reading&pattern=ansiedad-silencio

## EXP 6 Portal Privado de Lectura Revelada

- Deep link: https://mnle.reconociendotupoder.com/?scene=exp6-portal
- Copy:
  - `Portal Privado de Lectura Revelada`
  - `Patrón dominante revelado.`
  - `Guía humana asignada: Janny Helguero.`
  - `Veyra reveló.`
  - `Janny ordena.`
- Botón: `VER MENSAJE DE JANNY`
