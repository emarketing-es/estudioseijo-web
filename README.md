# estudioseijo.com · sitio corporativo

Sitio web de Estudio Seijo (Betanzos). Construido con **Astro + TypeScript** a partir de la maqueta aprobada
(`referencia/maqueta/`) y el manual de marca (`referencia/marca/`).

- Diseño editable de las páginas (lienzo en Claude): https://claude.ai/artifact/Wq4VDXbRGxSKLZYmtsNA4K
- Instrucciones de desarrollo, alcance y criterios de calidad: [`CLAUDE.md`](CLAUDE.md)
- Datos que faltan por recibir: [`referencia/contenidos/pendientes.md`](referencia/contenidos/pendientes.md)

## Estado

| Fase                             | Estado                                 |
| -------------------------------- | -------------------------------------- |
| 1 · Arranque                     | ✅ Terminada                           |
| 2 · Maquetación                  | ✅ Terminada                           |
| 3 · Blog y CMS                   | ✅ Terminada (falta migrar los textos) |
| 4 · Reservas con Google Calendar | Pendiente                              |
| 5 · Formularios, RGPD y legal    | Pendiente                              |
| 6 · SEO y analítica              | Pendiente                              |
| 7 · QA y publicación             | Pendiente                              |

## Requisitos

- **Node.js 24 LTS** (mínimo 22.12). La versión está en `.nvmrc` (`nvm use`).
- **pnpm 10** (`corepack enable` lo activa con la versión fijada en `package.json`).

## Instalación y uso

```bash
pnpm install          # instala las dependencias
cp .env.example .env  # variables de entorno (en la fase 1 no hace falta rellenar nada)
pnpm dev              # servidor de desarrollo en http://localhost:4321
```

| Script          | Qué hace                                                          |
| --------------- | ----------------------------------------------------------------- |
| `pnpm dev`      | Servidor de desarrollo con recarga automática                     |
| `pnpm cms`      | Servidor local del gestor de contenidos (usar junto a `pnpm dev`) |
| `pnpm build`    | Genera el sitio de producción en `dist/`                          |
| `pnpm preview`  | Sirve `dist/` para revisarlo como en producción                   |
| `pnpm check`    | Comprueba los tipos (TypeScript y componentes `.astro`)           |
| `pnpm lint`     | Revisa el código con ESLint (incluye reglas de accesibilidad)     |
| `pnpm format`   | Formatea el código con Prettier (`format:check` solo comprueba)   |
| `pnpm test`     | Tests unitarios (Vitest)                                          |
| `pnpm test:e2e` | Tests de extremo a extremo (Playwright) sobre el sitio construido |
| `pnpm verify`   | Lint + formato + tipos + tests unitarios + build, en un solo paso |

### Tests de extremo a extremo

`pnpm test:e2e` no construye el sitio por sí solo: ejecuta antes `pnpm build`. La primera vez instala el navegador con
`pnpm exec playwright install chromium`. Si ya tienes un Chromium instalado, puedes indicar su ruta en la variable
`PLAYWRIGHT_CHROMIUM_EXECUTABLE`.

Las pruebas recorren todas las rutas en escritorio y móvil y comprueban: que cargan sin errores, que no hay
scroll horizontal a 360 px, que no hay fallos de accesibilidad WCAG 2.2 AA (axe), el enlace «Saltar al contenido»,
la página actual en el menú y el menú móvil con teclado.

## Estructura

```
├─ referencia/            Fuentes de verdad: maqueta, marca y contenidos (no se modifican)
├─ public/                Archivos que se publican tal cual (logotipos, favicons, imágenes del blog)
│  └─ admin/              Gestor de contenidos Decap CMS (config.yml)
├─ scripts/               Utilidades de build (copia de Decap CMS)
├─ src/
│  ├─ config/             Datos de la empresa, menús, categorías del blog y reglas de reserva
│  ├─ data/               Textos del inicio, licencias de software y reseñas
│  ├─ content/blog/       Artículos del blog en Markdown
│  ├─ lib/                Lógica sin interfaz (blog, cálculo de huecos y solicitud de reserva)
│  ├─ styles/             tokens.css (colores, tipografía, espaciado), base.css, layout.css
│  ├─ components/
│  │  ├─ layout/          Cabecera y pie
│  │  ├─ inicio/          Una pieza por sección del inicio
│  │  ├─ reserva/         Calendario, horas, formulario y confirmación
│  │  ├─ blog/            Tarjetas y listado de artículos
│  │  ├─ opiniones/       Tarjetas de reseñas y huecos «Pendiente»
│  │  └─ ui/              Iconos, etiquetas y piezas reutilizables
│  ├─ layouts/            Base (head y estructura), Pagina (cabecera de sección), Articulo, Legal
│  └─ pages/              Una página por ruta del sitio
├─ tests/
│  ├─ unit/               Vitest
│  └─ e2e/                Playwright
└─ .github/workflows/     Integración continua
```

### Dónde cambiar las cosas habituales

- **Teléfono, WhatsApp, correo, enlaces de Google, menús:** `src/config/sitio.ts`.
- **Textos de las secciones del inicio** (casos, pasos, servicios, nosotros): `src/data/inicio.ts`.
- **Licencias de software y precios:** `src/data/software.ts`.
- **Reseñas reales de Google:** `src/data/opiniones.json` (mientras esté vacío se ven los huecos «Pendiente»).
- **Horario de reuniones y antelación:** `src/config/reservas.ts`. **Festivos:** `config/festivos.json`.
- **Artículos del blog:** desde `/admin` (ver «Cómo publicar en el blog») o en `src/content/blog/*.md`.
- **Colores, tipografía, radios, espaciado:** `src/styles/tokens.css`.
- **Iconos:** `src/components/ui/SpriteIconos.astro` (iconos de línea, trazo 1,8).

Los datos que aún no se han recibido valen `null` y están marcados con `PENDIENTE` en el código. Nunca se
sustituyen por datos de ejemplo.

## Decisiones técnicas

- **Astro en modo estático.** Todas las páginas se generan como HTML: carga muy rápida y hosting barato. Las
  funciones de servidor (reservas y formularios) se añadirán en la fase 4 con el adaptador del hosting elegido.
- **Tipografías servidas desde nuestro dominio** (`@fontsource`). DM Sans en versión variable con eje de tamaño
  óptico, igual que la maqueta con Google Fonts, pero sin enviar la IP del visitante a Google antes del
  consentimiento y sin depender de un servidor externo.
- **CSS propio con variables** y los mismos nombres de clase que la maqueta, para reproducirla fielmente. Sin
  frameworks de interfaz.
- **Color «ok»:** se usa `#3E7A66` (maqueta) para textos e iconos porque cumple contraste AA; `#85AFA0` (manual) queda
  como `--ok-deco` solo para elementos decorativos.
- **Accesibilidad:** enlace «Saltar al contenido» visible al recibir el foco, foco visible en todos los elementos,
  menú móvil con `aria-expanded` que se cierra con Escape.
- **Decap CMS servido desde nuestro dominio** (`scripts/copiar-decap.mjs` lo copia de `node_modules` antes de cada
  `dev`/`build`), sin depender de un CDN externo. Versión fijada en `package.json`.

## Reserva (estado provisional hasta la fase 4)

El calendario muestra huecos calculados con las reglas de `src/config/reservas.ts` (los de la maqueta) y, al
confirmar, prepara la solicitud para enviarla por WhatsApp o email desde el dispositivo del visitante, como en la
maqueta. Aún **no** consulta ni crea eventos en Google Calendar.

La interfaz pide los huecos a un «proveedor» (`src/lib/reservas/proveedor.ts`): en la fase 4 se cambia el
proveedor provisional por uno que llama a `/api/disponibilidad`, sin tocar la interfaz. Si se define
`PUBLIC_GOOGLE_BOOKING_URL`, la sección muestra la agenda de citas de Google en lugar del calendario propio (plan B).

El calendario se maneja con teclado: flechas para moverse entre días disponibles, Inicio/Fin para el primer y
último día libre de la semana y Re Pág/Av Pág para cambiar de mes.

## Cómo publicar en el blog

Los artículos se gestionan desde el **gestor de contenidos** en `/admin` (Decap CMS). No hace falta tocar código.

### Escribir un artículo

1. Entra en `/admin` y pulsa **+ Artículo**.
2. Rellena los campos:
   - **Título** y **Resumen** (una o dos frases: se ven en las tarjetas del blog y en Google).
   - **Fecha** de publicación y **Categoría**.
   - **Autor** (si lo dejas vacío, firma «Estudio Seijo»).
   - **Imagen de cabecera** (opcional). Si la pones, rellena también la **Descripción de la imagen**. Sin imagen,
     el artículo usa la composición geométrica de colores de su categoría.
   - **Texto**: el editor permite títulos, negritas, listas, enlaces, citas e imágenes. A la derecha ves la vista
     previa con el estilo de la web.
3. Si aún no quieres publicarlo, activa **Borrador**: se guarda, pero no aparece en la web.
4. Pulsa **Publicar**. La web se vuelve a construir sola y el artículo aparece en unos minutos (cuando el sitio
   esté desplegado; ver «Despliegue»).

El tiempo de lectura, la página del artículo, su categoría, los artículos relacionados y el listado del blog se
generan solos.

### Quién puede publicar

Cada persona que publique necesita una **cuenta de GitHub con permiso de escritura** en este repositorio. Al
entrar en `/admin` se pulsa «Iniciar sesión con GitHub».

> **Pendiente (hosting):** el acceso con GitHub desde la web publicada necesita un servicio de autenticación
> (automático en Netlify; en otros hostings se configura `base_url` en `public/admin/config.yml`). Mientras el
> hosting no esté decidido, el gestor se usa en modo local.

### Modo local (en el ordenador, sin GitHub)

```bash
pnpm dev   # en una terminal
pnpm cms   # en otra terminal
```

Abre `http://localhost:4321/admin/`: los cambios se guardan directamente en `src/content/blog/` y las imágenes en
`public/img/blog/`. Después se suben al repositorio con un commit normal.

### Artículos migrados y redirecciones

Si un artículo viene de la web antigua, su campo **URL en la web antigua** (`/noticia/…`) genera
automáticamente la redirección 301 en el archivo `/_redirects` (formato de Netlify y Cloudflare Pages), con las
variantes en que Google pudo indexarla (`%BF`, `%3A`, decodificada y con o sin barra final). Cualquier otra URL
`/noticia/…` redirige al listado del blog.

## Integración continua

En cada _pull request_ y en cada _push_ a `main`, GitHub Actions ejecuta: lint, formato, tipos, tests unitarios,
build y tests e2e con Playwright. Si fallan los e2e, el informe queda disponible como artefacto del job.

## Variables de entorno

Están documentadas en [`.env.example`](.env.example). `.env` nunca se sube al repositorio; en producción se
configuran en el panel del hosting. Las variables con prefijo `PUBLIC_` llegan al navegador: no deben contener
secretos.

## Pendiente de documentar en sus fases

- **Configuración de Google Calendar** (cuenta de servicio o OAuth): fase 4.
- **Despliegue** (depende del hosting, pendiente de confirmar): fases 4 y 7.

## Forma de trabajo

Una rama por fase, commits pequeños en español y _pull request_ al cerrar cada fase. Antes de cada fase se
propone el plan y se espera el visto bueno.
