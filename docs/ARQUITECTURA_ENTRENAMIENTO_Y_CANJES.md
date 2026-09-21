# Arquitectura segura: entrenamiento y recompensas

## Principio principal

El navegador presenta la experiencia, pero no es autoridad sobre los Puntos IMFRA ni sobre la entrega de beneficios. El saldo, el libro mayor, el inventario y los accesos solo pueden modificarse desde un proceso administrativo o de servidor.

## Colecciones preparadas

| Colección | Finalidad | Escritura desde navegador |
| --- | --- | --- |
| `training_questions` | Banco publicado de preguntas | Solo administradores |
| `training_cases` | Casos encadenados | Solo administradores |
| `training_flashcards` | Tarjetas de repaso | Solo administradores |
| `training_drafts` | Borradores editoriales | Solo administradores |
| `training_progress/{uid}` | XP formativo, casos, tarjetas y racha | Únicamente el propietario |
| `training_attempts` | Intentos inmutables para validación | El propietario solo crea |
| `reward_catalog` | Beneficios publicados | Solo administradores |
| `reward_accounts/{uid}` | Saldo autoritativo | Nunca desde navegador |
| `reward_ledger` | Movimientos auditables | Nunca desde navegador |
| `reward_requests` | Solicitudes pendientes | El propietario solo crea |
| `reward_redemptions` | Canjes aprobados y vigencia | Nunca desde navegador |

## Flujo de puntos

1. El alumno responde una actividad.
2. El cliente registra un intento con identificador determinista para evitar duplicados diarios.
3. Un proceso de servidor valida actividad, respuesta, membresía y si ya fue premiada.
4. En una transacción, el servidor agrega el movimiento al libro mayor y actualiza el saldo.
5. La interfaz vuelve a leer `reward_accounts/{uid}`; nunca calcula el saldo definitivo por sí misma.

## Flujo de canje

1. El usuario crea una solicitud `pending` con identificador idempotente.
2. El servidor valida saldo, costo vigente, inventario, membresía y restricciones.
3. En una sola transacción, descuenta puntos, registra el libro mayor y crea el canje.
4. La entrega de licencia ocurre fuera del documento público. No se guardan claves visibles en el frontend.
5. El usuario recibe estado aprobado, rechazado o requiere atención, con trazabilidad.

## Diferencia entre XP y Puntos IMFRA

- **XP formativo:** sirve para avance, rachas, insignias y motivación. Puede sincronizarse desde el dispositivo bajo reglas limitadas.
- **Puntos IMFRA:** tienen valor de canje. Solo el servidor puede otorgarlos, descontarlos o revertirlos.

## Pendiente antes de producción

- Implementar el procesador transaccional en el backend elegido.
- Aprobar costos, inventario, vigencia, límites y método de entrega de cada recompensa.
- Desplegar y probar las reglas de Firestore en un entorno de pruebas.
- Añadir pruebas de concurrencia, reintentos, reversos y caducidad.
- Conectar las notificaciones de aprobación o rechazo.

Las reglas y adaptadores de esta rama son preparación técnica: no han sido desplegados y no alteran producción.
