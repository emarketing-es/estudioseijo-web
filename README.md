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
| 4 · Reservas con Google Calendar | ✅ Terminada (faltan credenciales)     |
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

- **Astro con páginas estáticas y dos funciones de servidor.** Todas las páginas se generan como HTML (carga muy
  rápida); solo `/api/disponibilidad` y `/api/reservas` se ejecutan en el servidor. Adaptador de Node
  (`@astrojs/node`) mientras se decide el hosting: en Netlify o Cloudflare se cambia una línea de `astro.config.mjs`.
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

## Reservas con Google Calendar

### Cómo funciona

1. El calendario de la web pide los huecos a `GET /api/disponibilidad`. El servidor consulta la ocupación del
   calendario de Google (`freeBusy`) y calcula los huecos libres con las reglas de `src/config/reservas.ts`
   (días laborables, franjas, 60 min, margen entre citas, 24 h de antelación, 60 días vista y festivos de
   `config/festivos.json`), siempre en hora de Madrid y teniendo en cuenta los cambios de hora.
2. Al confirmar, `POST /api/reservas` valida los datos (zod), comprueba el anti-spam (Cloudflare Turnstile, campo
   trampa y límite por IP), **vuelve a comprobar** que el hueco sigue libre y crea el evento en Google Calendar con
   el cliente como invitado: con Google Meet si es videoconferencia o con la dirección si es presencial. Google
   envía la invitación; además se envían el correo de confirmación al cliente y el aviso interno.
3. El visitante pasa a `/reserva/confirmada` con el resumen (evento GA4 `reserva_confirmada`).

**Sin credenciales de Google** la web no se rompe: el calendario usa las mismas reglas sin consultar Google y,
al confirmar, prepara la solicitud para enviarla por WhatsApp o email (como en la maqueta). Si se define
`PUBLIC_GOOGLE_BOOKING_URL`, se muestra en su lugar la agenda de citas de Google (plan B).

El calendario se maneja con teclado: flechas para moverse entre días disponibles, Inicio/Fin para el primer y
último día libre de la semana y Re Pág/Av Pág para cambiar de mes.

### Conectar Google Calendar

Hay dos opciones según el tipo de cuenta de Google de Estudio Seijo (**PENDIENTE**: confirmar cuál es).

**Opción A · Google Workspace (recomendada): cuenta de servicio con delegación de dominio**

1. En [Google Cloud Console](https://console.cloud.google.com/) crea un proyecto (p. ej. «estudioseijo-web») y
   activa la **Google Calendar API** (APIs y servicios → Biblioteca).
2. APIs y servicios → Credenciales → Crear credenciales → **Cuenta de servicio**. Ábrela → Claves → Añadir clave
   → JSON. Del archivo descargado salen `client_email` y `private_key`. Copia también el **ID de cliente** numérico.
3. En la [consola de administración de Workspace](https://admin.google.com/): Seguridad → Acceso y control de datos
   → Controles de API → **Delegación de todo el dominio** → Añadir: el ID de cliente y el ámbito
   `https://www.googleapis.com/auth/calendar`.
4. Variables de entorno:
   - `GOOGLE_SERVICE_ACCOUNT_EMAIL` = `client_email`
   - `GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY` = `private_key` (en una línea, con los saltos escritos como `\n`)
   - `GOOGLE_IMPERSONATE_USER` = la cuenta en cuyo nombre se crean las reuniones (p. ej. `info@estudioseijo.com`)
   - `GOOGLE_CALENDAR_ID` = el calendario (normalmente la misma dirección)

**Opción B · Gmail personal: OAuth con refresh token**

1. Mismo paso 1 que en la opción A.
2. APIs y servicios → Pantalla de consentimiento de OAuth: tipo «Externo», añade como usuario de prueba la cuenta
   del calendario y **publica la aplicación** (en modo prueba los tokens caducan a los 7 días).
3. Credenciales → Crear credenciales → **ID de cliente de OAuth** → tipo «Aplicación web», con
   `https://developers.google.com/oauthplayground` como URI de redirección autorizada.
4. En [OAuth Playground](https://developers.google.com/oauthplayground): ⚙️ → «Use your own OAuth credentials» (pega
   ID y secreto) → ámbito `https://www.googleapis.com/auth/calendar` → Authorize APIs (con la cuenta del
   calendario) → «Exchange authorization code for tokens» → copia el **refresh token**.
5. Variables de entorno: `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REFRESH_TOKEN` y
   `GOOGLE_CALENDAR_ID` (la dirección de Gmail o el ID del calendario).

Si están las dos, se usa la cuenta de servicio. Las credenciales son secretos: van en `.env` (local) o en el panel
del hosting, **nunca** en el repositorio.

### Correo y anti-spam

- **Correo:** `MAIL_FROM` + `RESEND_API_KEY` (Resend) o `MAIL_FROM` + `SMTP_*`. Sin ellos, los correos no se
  envían (en desarrollo se muestran en la consola); Google sigue enviando la invitación del evento.
  `MAIL_AVISOS` recibe el aviso interno (por defecto, info@estudioseijo.com).
- **Turnstile:** crea un widget en el panel de Cloudflare (Turnstile) para el dominio y rellena
  `PUBLIC_TURNSTILE_SITE_KEY` y `TURNSTILE_SECRET_KEY`. Muy recomendable en producción: cada reserva envía una
  invitación desde vuestro calendario.

### Pruebas de las reservas

- Tests unitarios del cálculo de huecos (festivos, fines de semana, solapes, margen, antelación y cambios de hora
  de octubre y marzo), del cliente de Google y de las funciones de servidor.
- Tests e2e del flujo completo contra un **Google simulado** (`tests/e2e/google-simulado.mjs`): huecos reales,
  reserva con Meet, presencial, hueco ocupado entre medias y validación en servidor. También en la integración
  continua; nunca se llama a Google de verdad.

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

- **Despliegue** (depende del hosting, pendiente de confirmar): fase 7. Con el adaptador actual, `pnpm build` genera
  `dist/client` (estático) y `dist/server/entry.mjs` (se ejecuta con `node dist/server/entry.mjs`, puerto en `PORT`).

## Forma de trabajo

Una rama por fase, commits pequeños en español y _pull request_ al cerrar cada fase. Antes de cada fase se
propone el plan y se espera el visto bueno.
