# IMFRA Desarrollo

Sitio institucional y plataforma privada de capacitación para ingeniería civil, construcción y arquitectura.

## Desarrollo seguro

- `main`: versión actualmente publicada. No se modifica durante la reconstrucción.
- `imfra-v2`: rama privada de desarrollo y revisión.

La aplicación existente se conserva mientras la nueva arquitectura se implementa por módulos. Consulta `docs/IMFRA_V2_PLAN.md` para conocer el orden y los criterios de publicación.

## Ejecutar localmente

```bash
npm install
npm run dev
```

Los servicios reales de Firebase, Railway, Stripe y Bunny no deben modificarse durante pruebas locales sin autorización expresa.
