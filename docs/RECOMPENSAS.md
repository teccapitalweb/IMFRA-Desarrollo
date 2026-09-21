# Recompensas — diseño funcional

## Nombre elegido

La pestaña se llama **Recompensas**. La acción sobre cada beneficio se llama **Canjear**.

Esta nomenclatura separa claramente dos productos:

- **Herramientas pro:** calculadoras, controles y reportes técnicos que el miembro utiliza en obra.
- **Recompensas:** software, licencias y recursos que el miembro obtiene usando Puntos IMFRA.

## Prototipo privado

La versión privada permite validar la experiencia visual mediante:

- Saldo de Puntos IMFRA.
- Nivel profesional.
- Programa técnico diario de tres rondas y doce desafíos.
- Casos de obra, cálculos con medidas, conceptos e identificación visual.
- Fotografías reales aportadas por IMFRA y diagramas técnicos propios.
- Resultado por ronda, continuidad explícita y resultado final de precisión técnica.
- Explicación de la respuesta.
- Catálogo provisional.
- Canjes simulados guardados únicamente en el navegador cuando se usa modo demo.
- En modo real, solicitudes pendientes sin descuento local ni activación anticipada.

No entrega licencias reales ni modifica Firebase, Railway, Stripe o Bunny.

## Modelo previsto para producción

Los puntos canjeables no deben calcularse ni modificarse en el navegador. El backend será la única autoridad.

La interfaz ya respeta esta separación: registra intentos y solicitudes, y consulta el saldo autoritativo. Falta implementar y desplegar el procesador de servidor que valide y ejecute las transacciones.

Fuentes propuestas:

| Actividad verificada | Puntos iniciales |
| --- | ---: |
| Desafío diario correcto | 25 |
| Desafío diario completado | 5 |
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
