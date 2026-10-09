# estudioseijo.com · sitio corporativo

Sitio web de Estudio Seijo (Betanzos). Construido con **Astro + TypeScript** a partir de la maqueta aprobada
(`referencia/maqueta/`) y el manual de marca (`referencia/marca/`).

- Diseño editable de las páginas (lienzo en Claude): https://claude.ai/artifact/Wq4VDXbRGxSKLZYmtsNA4K
- Instrucciones de desarrollo, alcance y criterios de calidad: [`CLAUDE.md`](CLAUDE.md)
- Datos que faltan por recibir: [`referencia/contenidos/pendientes.md`](referencia/contenidos/pendientes.md)

## Estado

| Fase                             | Estado       |
| -------------------------------- | ------------ |
| 1 · Arranque                     | ✅ Terminada |
| 2 · Maquetación                  | ✅ Terminada |
| 3 · Blog y CMS                   | Pendiente    |
| 4 · Reservas con Google Calendar | Pendiente    |
| 5 · Formularios, RGPD y legal    | Pendiente    |
| 6 · SEO y analítica              | Pendiente    |
| 7 · QA y publicación             | Pendiente    |

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
├─ public/                Archivos que se publican tal cual (logotipos, favicons; /admin del CMS en la fase 3)
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
│  ├─ layouts/            Base (head y estructura), Pagina (cabecera de sección), Legal
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
- **Artículos del blog:** `src/content/blog/*.md` (desde la fase 3, también desde `/admin`).
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

## Reserva (estado provisional hasta la fase 4)

El calendario muestra huecos calculados con las reglas de `src/config/reservas.ts` (los de la maqueta) y, al
confirmar, prepara la solicitud para enviarla por WhatsApp o email desde el dispositivo del visitante, como en la
maqueta. Aún **no** consulta ni crea eventos en Google Calendar.

La interfaz pide los huecos a un «proveedor» (`src/lib/reservas/proveedor.ts`): en la fase 4 se cambia el
proveedor provisional por uno que llama a `/api/disponibilidad`, sin tocar la interfaz. Si se define
`PUBLIC_GOOGLE_BOOKING_URL`, la sección muestra la agenda de citas de Google en lugar del calendario propio (plan B).

El calendario se maneja con teclado: flechas para moverse entre días disponibles, Inicio/Fin para el primer y
último día libre de la semana y Re Pág/Av Pág para cambiar de mes.

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
- **Cómo publicar en el blog** con Decap CMS (`/admin`): fase 3.

## Forma de trabajo

Una rama por fase, commits pequeños en español y _pull request_ al cerrar cada fase. Antes de cada fase se
propone el plan y se espera el visto bueno.
