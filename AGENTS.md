# AGENTS

## Resumen del proyecto
- Sitio personal construido con Astro y contenido MD/MDX.
- Estilos con Tailwind CSS + DaisyUI; tipografia gestionada por Astro.
- Despliegue con adaptador de Vercel; RSS y sitemap incluidos.
- Envio de correo via AWS SES desde acciones del servidor.

## Comandos utiles (pnpm)
- `pnpm install` instala dependencias.
- `pnpm dev` levanta el entorno local.
- `pnpm build` genera el build.
- `pnpm preview` previsualiza el build.
- `pnpm lint` ejecuta Biome lint.
- `pnpm format` ejecuta Biome format.
- `pnpm check` ejecuta Biome check (usado en lint-staged).

## Estructura principal
- `src/pages/` rutas Astro, con i18n en `src/pages/[lang]/`.
- `src/content/` contenido del blog, separado por idioma (`en`, `es`).
- `src/content.config.ts` define colecciones y frontmatter del blog.
- `src/actions/` acciones del servidor (Astro).
- `src/core/` casos de uso y tipos del dominio.
- `src/infra/` integraciones externas (ej. SES).
- `src/presentation/` componentes, layouts, estilos y assets de UI.
- `public/` archivos estaticos.

## Convenciones de codigo
- ESM, TypeScript.
- Biome formatea con 4 espacios e impone comillas dobles.
- Evitar reglas deshabilitadas solo si hay necesidad real.
- Mantener el patron de i18n: rutas y contenido por idioma.

## Notas de calidad
- No hay tests automatizados definidos actualmente.
- Antes de cambios grandes en UI, revisar estilos existentes en `src/presentation/styles/`.
- Al terminar una funcionalidad, ejecutar `pnpm check:fix` para autoresolver problemas de linting y formato.
