# Cierre funcional de IMFRA v2

## Terminado en la rama privada

- Navegación y diseño premium responsivo.
- Cursos, clases en vivo, PDFs, libros, logros y certificados.
- Foro, directorio, perfil y suscripción.
- Ocho herramientas profesionales conservadas.
- Recompensas con catálogo, confirmación e historial de canje piloto.
- Quiz técnico de 12 desafíos, tres rondas y fotografías reales.
- Centro de Entrenamiento con casos, flashcards, racha, misiones, XP e insignias.
- Panel administrativo visual para revisar el banco académico y crear borradores.

## Bloqueos deliberados para producción

La interfaz está lista para revisión, pero estas operaciones continúan como prototipo seguro hasta definir reglas comerciales y backend:

1. Los Puntos IMFRA no deben poder modificarse desde el navegador.
2. Cada premio necesita inventario, vigencia, restricciones y método de entrega aprobados.
3. El administrador de retos necesita colecciones, permisos, auditoría y versionado.
4. Rachas, misiones y progreso deben sincronizarse por usuario y dispositivo.
5. Los canjes necesitan transacción atómica y libro mayor inmutable.

## Colecciones sugeridas

- `training_questions`
- `training_cases`
- `training_flashcards`
- `training_attempts`
- `reward_catalog`
- `reward_ledger`
- `reward_redemptions`

No debe publicarse el canje real hasta completar reglas, pruebas de seguridad e idempotencia.
