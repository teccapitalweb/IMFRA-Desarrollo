# Código modular de IMFRA v2

La aplicación actual permanece en los archivos HTML de la raíz mientras se migra de manera incremental. Ninguna pantalla se reemplaza hasta que su equivalente v2 haya sido probado y aprobado.

Estructura prevista:

- `core/`: autenticación, API, permisos, progreso, pagos y certificados.
- `pages/`: pantallas del miembro.
- `admin/`: funciones administrativas.
- `ui/`: navegación y componentes reutilizables.
- `styles/`: tokens, estilos base, componentes y responsive.
- `data/`: modelos y catálogos normalizados.

