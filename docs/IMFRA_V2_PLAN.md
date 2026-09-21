# Plan de trabajo — IMFRA v2

## Regla principal

La rama pública `main` no se modifica durante el desarrollo. Todo el trabajo se realiza en `imfra-v2`. Publicar, fusionar o cambiar infraestructura requiere aprobación expresa.

## Estado inicial

- Fuente pública: GitHub Pages desde `main`.
- Aplicación: HTML, CSS y JavaScript sin proceso de compilación.
- Servicios existentes: Firebase, Railway, Stripe y Bunny.
- Riesgo principal: archivos monolíticos y operaciones sensibles iniciadas desde el navegador.

## Estrategia

La migración será incremental. La versión actual seguirá disponible mientras cada módulo nuevo se construye y verifica en privado.

### Fase 0 — Base segura

- [x] Crear la rama remota `imfra-v2` desde `main`.
- [x] Clonar y conectar una copia local.
- [x] Añadir Vite y TypeScript sin reemplazar las páginas actuales.
- [x] Documentar límites de publicación.
- [x] Instalar dependencias y comprobar el build inicial.
- [ ] Crear una vista local de comparación.

### Fase 1 — Sistema visual y shell

- [ ] Extraer tokens de marca.
- [ ] Unificar tipografías, colores, espacios, botones y formularios.
- [ ] Crear navegación compartida para escritorio y móvil.
- [ ] Crear estados de carga, error, vacío y sin acceso.
- [ ] Migrar inicio de sesión y estructura del panel.

### Fase 2 — Experiencia académica

- [ ] Normalizar catálogo de cursos y materiales.
- [ ] Crear ficha de curso y reproductor modular.
- [ ] Persistir progreso en servidor.
- [ ] Añadir evaluaciones e historial de intentos.
- [ ] Crear biblioteca y búsqueda global.

### Fase 3 — Seguridad

- [ ] Auditar reglas de Firestore con emulador.
- [ ] Emitir certificados únicamente desde backend.
- [ ] Restringir la verificación pública a consultas por folio.
- [ ] Validar membresía y permisos en servidor.
- [ ] Añadir pruebas para Stripe, acceso, progreso y administración.

### Fase 4 — Diferenciación IMFRA

- [ ] Guardar proyectos de las herramientas en la cuenta.
- [ ] Añadir referencias, supuestos y versiones a cálculos técnicos.
- [ ] Crear portafolio profesional verificable.
- [ ] Incorporar analítica académica y comercial.

## Criterios para publicar

Una migración a `main` solo será posible cuando:

1. El build termine sin errores.
2. Los flujos de registro, pago, acceso, curso y certificado estén probados.
3. La experiencia móvil haya sido revisada.
4. No queden enlaces provisionales ni datos de demostración visibles.
5. Exista una copia recuperable de la versión anterior.
6. El propietario de IMFRA apruebe expresamente la publicación.
