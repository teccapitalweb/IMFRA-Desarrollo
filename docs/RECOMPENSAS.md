# Recompensas — diseño funcional

## Nombre elegido

La pestaña se llama **Recompensas**. La acción sobre cada beneficio se llama **Canjear**.

Esta nomenclatura separa claramente dos productos:

- **Herramientas pro:** calculadoras, controles y reportes técnicos que el miembro utiliza en obra.
- **Recompensas:** software, licencias y recursos que el miembro obtiene usando Puntos IMFRA.

## Modo de prueba

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
- En modo real, el saldo, los canjes digitales y los accesos se resuelven en el backend.
- Herramientas, materiales, libros, plantillas y software usan el mismo endpoint transaccional; el navegador nunca crea el canje directamente en Firestore.
- Cada producto muestra una celebración breve con identidad propia después de una confirmación real. La tarjeta es informativa, no captura clics y desaparece sola.

El modo `?modo=demo` no modifica Firebase, Railway, Stripe o Bunny. El modo autenticado sí usa el saldo autoritativo del backend.

## Modelo de producción

Los puntos canjeables no deben calcularse ni modificarse en el navegador. El backend será la única autoridad.

La interfaz respeta esta separación: registra intentos, consulta el saldo autoritativo y solicita canjes idempotentes. El backend valida y ejecuta los movimientos dentro de transacciones de Firestore.

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

## Reglas vigentes de Créditos IMFRA (materiales, libros y herramientas)

- Toda cuenta, con o sin membresía, recibe 120 créditos de cortesía al consultar su saldo por primera vez.
- El primer material de **PDFs y material** y la primera herramienta cuestan 120: el bono alcanza para uno de los dos.
- Cualquier cuenta (VIP o no) puede canjear materiales, libros y herramientas con créditos. El backend ya no exige VIP para materiales.
- Al tocar un material o libro bloqueado se muestra un popup breve: «¿Canjear N créditos?». Al aceptar se descuenta el saldo y se abre el archivo.
- Sin saldo suficiente el popup dice «Créditos insuficientes… Gánalos en Retos» con botón «Ir a Retos».
- Los libros cuestan más que cualquier material (300, 320 y 350 frente a un máximo de 260).
- En **Retos** solo los miembros VIP suman créditos por acierto (validado en servidor con 403 para cuentas sin membresía). La sección lo indica a las cuentas sin VIP.
- Desde el panel admin (`vip-admin.html` → detalle del miembro → **Créditos IMFRA**) se pueden regalar o vender créditos. El backend expone `GET /admin/creditos/:uid` y `POST /admin/creditos` y registra cada movimiento en `referral_ledger` como `admin_gift` o `admin_sale`.
- Cada regalo o venta nuevo genera, en la misma transacción, una notificación privada del miembro. El panel sincroniza saldo y avisos cada 15 segundos, diferencia **Créditos de regalo** de **Compra acreditada** y conserva el aviso para el siguiente inicio de sesión hasta que el usuario lo lea.
- El aviso de créditos usa una tarjeta responsive no modal: en escritorio aparece centrada bajo el encabezado y en móvil se adapta al borde inferior. Destaca monto y saldo, permanece visible 5.8 segundos y enlaza a la campana.
- Los libros de pago pueden canjearse permanentemente con Créditos IMFRA. Una membresía VIP permite leerlos sin ocultar la opción de canje permanente.

## Software de presupuestos

- Cuesta 350 Créditos IMFRA y se adquiere una sola vez.
- El descuento, `credit_transactions`, `reward_redemptions` y `budget_access` se escriben atómicamente.
- Un reintento o doble clic devuelve el acceso existente sin volver a descontar.
- La ruta `#presupuestos` comprueba el permiso en el servidor; sin acceso regresa a Retos y muestra la indicación de desbloqueo.
- Proyectos, presupuestos, APU, insumos, generadores, versiones y reportes se guardan en Firestore. `localStorage` se utiliza únicamente en `modo=demo`.
