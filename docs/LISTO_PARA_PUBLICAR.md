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
- Sincronización preparada para XP, casos, flashcards y rachas por usuario.
- Solicitudes de canje pendientes sin descuento de puntos en el navegador.
- Reglas de seguridad preparadas para contenido, intentos, saldos, libro mayor y canjes.

## Bloqueos deliberados para producción

La interfaz está lista para revisión, pero estas operaciones continúan como prototipo seguro hasta definir reglas comerciales y backend:

1. Implementar el procesador de servidor que valide intentos y otorgue puntos.
2. Cada premio necesita inventario, vigencia, restricciones y método de entrega aprobados.
3. Implementar la transacción atómica que descuente saldo y entregue el beneficio.
4. Desplegar las reglas primero en pruebas y verificar concurrencia e idempotencia.
5. Aprobar el catálogo y realizar una prueba completa con cuentas internas.

## Colecciones sugeridas

- `training_questions`
- `training_cases`
- `training_flashcards`
- `training_attempts`
- `training_progress`
- `reward_catalog`
- `reward_accounts`
- `reward_ledger`
- `reward_requests`
- `reward_redemptions`

Estas colecciones y sus reglas ya están definidas en la rama privada, pero aún no están desplegadas. No debe publicarse el canje real hasta completar el procesador, las pruebas de seguridad y la aprobación comercial.
