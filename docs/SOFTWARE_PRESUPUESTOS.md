# Software de presupuestos IMFRA

## Acceso

El punto de entrada es **Retos → Recompensas IMFRA → Software de presupuestos**. El producto cuesta 350 Créditos IMFRA y queda asociado permanentemente al usuario. La interfaz consulta `GET /budgets/access`; no confía en un indicador local para autorizar el módulo.

## Módulos

- Dashboard de proyectos con búsqueda, estado, duplicado, renombrado, archivo y eliminación lógica.
- Presupuesto editable por partidas, subpartidas y conceptos, con arrastre, importación y biblioteca reutilizable.
- APU por materiales, mano de obra, maquinaria, equipo, herramientas y auxiliares.
- Biblioteca de insumos, números generadores y explosión consolidada.
- Costos indirectos, financiamiento, utilidad, cargos adicionales e IVA con precisión interna de cuatro decimales.
- Reportes con vista previa, PDF, Excel e impresión.
- Versiones históricas inmutables, autoguardado, deshacer, rehacer y control de conflictos por revisión.

## Persistencia

`budgets` mantiene el documento autoritativo de cada espacio de trabajo. El backend materializa vistas por entidad en `budget_sections`, `budget_concepts`, `apu`, `apu_items`, `supplies`, `labor`, `equipment`, `generators`, `generator_items` e `indirect_costs`. Los accesos y movimientos se guardan en `budget_access` y `credit_transactions`.

Los datos de `?modo=demo` viven de forma deliberada en el navegador y nunca se mezclan con una cuenta real.

## Seguridad y consistencia

- Todas las rutas requieren token Firebase y propiedad del proyecto.
- El canje y el saldo se actualizan atómicamente e idempotentemente.
- El autoguardado usa `expectedRevision`; un cambio concurrente devuelve `REVISION_CONFLICT`.
- Las versiones se escriben como instantáneas nuevas y no sobrescriben históricos.
- La normalización secundaria no invalida un autoguardado ya confirmado si Firestore presenta una falla temporal.
