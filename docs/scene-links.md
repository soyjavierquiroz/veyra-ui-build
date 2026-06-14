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
- El procesamiento posterior a la pregunta 5 dura aprox. 11.5s y se revela por pasos.
- La lectura revelada aparece por capas con pacing lento.
- CTA final: `ABRIR EL CAMINO HACIA JANNY`.
- Loop ambiental: `/audio/loop-quiz.mp3`.
- El loop inicia en el flujo real al presionar `CRUZAR EL UMBRAL`.
- Por deep link no se fuerza autoplay.
- El loop se detiene al presionar `ABRIR EL CAMINO HACIA JANNY`.

EXP 5 acepta `pattern`. Si se abre `?scene=exp5-reading` sin pattern, usa `abandono`.
