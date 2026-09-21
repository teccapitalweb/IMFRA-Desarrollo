# Recompensas — diseño funcional

## Nombre elegido

La pestaña se llama **Recompensas**. La acción sobre cada beneficio se llama **Canjear**.

Esta nomenclatura separa claramente dos productos:

- **Herramientas pro:** calculadoras, controles y reportes técnicos que el miembro utiliza en obra.
- **Recompensas:** software, licencias y recursos que el miembro obtiene usando Puntos IMFRA.

## Prototipo privado

La primera versión permite validar la experiencia visual mediante:

- Saldo de Puntos IMFRA.
- Nivel profesional.
- Reto técnico diario.
- Explicación de la respuesta.
- Catálogo provisional.
- Canjes simulados guardados únicamente en el navegador.

No entrega licencias reales ni modifica Firebase, Railway, Stripe o Bunny.

## Modelo previsto para producción

Los puntos canjeables no deben calcularse ni modificarse en el navegador. El backend será la única autoridad.

Fuentes propuestas:

| Actividad verificada | Puntos iniciales |
| --- | ---: |
| Reto diario correcto | 30 |
| Reto diario completado | 10 |
| Evaluación aprobada | 20 |
| Curso completado | 50 |

Los valores deberán poder modificarse desde configuración sin cambiar código.

## Reglas de seguridad

Antes de publicar:

1. Registrar cada movimiento en un libro mayor inmutable.
2. Evitar recompensar dos veces la misma actividad.
3. Ejecutar el canje en una transacción de servidor.
4. Comprobar saldo, membresía, inventario y vigencia.
5. Guardar quién aprobó o entregó la licencia.
6. Nunca almacenar claves de software visibles en Firestore o en el frontend.
7. Permitir cancelar o revertir un canje con trazabilidad administrativa.

## Información pendiente del propietario

Para reemplazar el catálogo provisional harán falta:

- Nombre exacto de cada software.
- Duración o modalidad de acceso.
- Cantidad disponible.
- Costo deseado en puntos.
- Método de entrega.
- Restricciones por usuario.
- Vigencia de la recompensa.

