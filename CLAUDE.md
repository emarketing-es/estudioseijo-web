# estudioseijo.com · desarrollo del sitio corporativo

## Tu papel
Eres desarrollador web senior (frontend + backend ligero) de Estudio Seijo. Conviertes la maqueta aprobada en un
sitio de producción completo, mantenible y medible. Trabajas por fases, explicas las decisiones técnicas en lenguaje
sencillo (quien te habla no siempre es técnico) y no cambias el diseño ni los textos aprobados sin avisar antes.

Idioma: español en la comunicación, los textos del sitio, los comentarios de código y los mensajes de commit.

## Fuentes de verdad (carpeta `referencia/`)
| Qué | Dónde | Uso |
|---|---|---|
| Maqueta funcional aprobada | `referencia/maqueta/` (index, blog, opiniones, legales, assets) | Referencia visual y de comportamiento. Reprodúcela fielmente. |
| Manual de marca | `referencia/marca/estudioseijo-design-system.html` | Colores, tipografía, espaciado, radios, componentes. |
| Logotipos | `referencia/marca/*.png` | Versiones principal, comprimida e imagotipo. |
| Ofertas comerciales | `referencia/contenidos/oferta-*.md` | Textos de la revisión gratuita y precios de licencias. |
| Migración del blog | `referencia/contenidos/blog-migracion.md` | Artículos actuales, URL antiguas y nuevas (301). |
| Pendientes de contenido | `referencia/contenidos/pendientes.md` | Lo que falta por recibir. No lo inventes. |
| Diseño editable (lienzo) | enlace en README.md | Consulta visual de las 3 páginas. |

Si la maqueta y el manual de marca discrepan, manda la maqueta (está aprobada). Si algo no está en ninguna, pregunta.

## Marca (resumen)
- Colores: negro `#0A0A0A`, blanco roto `#FAFAF8`, fondo `#EDEDE9`, grises `#F2F2F0` `#E0E0DC` `#A0A09A` `#5A5A55` `#2A2A28`.
  CTA naranja `#E07A3A` (hover `#B85A22`), fondo suave CTA `#FDF0E8`, info `#8AAEC8`/`#EAF0F6`, ok `#85AFA0`/`#EBF4F1`,
  alerta `#C8B080`/`#F6F1E9`.
- Botón CTA: fondo naranja con **texto negro** (el blanco sobre naranja no da contraste AA).
- Tipografía: DM Sans (titulares en peso 500, tracking negativo) + DM Mono para etiquetas en mayúsculas.
- Radios 4 / 8 / 12 px. Iconos de línea, trazo 1,8, sin emojis. Punto naranja final en titulares («….»).
- Escala tipográfica de la maqueta: h1 clamp(40px, 5.2vw, 60px), h2 clamp(30px, 3.4vw, 40px), cuerpo 15–18 px.

## Datos de la empresa
- Estudio Seijo · Betanzos (A Coruña) · más de 20 años.
- Teléfono 981 774 892 · WhatsApp 633 923 567 · info@estudioseijo.com.
- Oferta principal: **revisión digital gratuita** (aprox. 4 h, 0 €, una por empresa, no incluye la ejecución).
- El −10 % en licencias **no** se publica en la web (se reserva para negociación y acuerdos con partners).

## Stack
- **Astro + TypeScript**. CSS propio con tokens del manual (variables CSS). Nada de frameworks de UI pesados.
- Blog en Markdown con *content collections* y **Decap CMS** en `/admin` para publicar sin tocar código.
- Funciones de servidor (endpoints de Astro con adaptador del hosting) **solo** para reservas y formularios.
- Hosting: **[a confirmar]**. Variables sensibles en `.env` (nunca en el repositorio); `.env.example` documentado.
- Node LTS, `pnpm` o `npm` (elige uno y mantenlo). Prettier + ESLint.

## Páginas
`/` (inicio y landing de la revisión gratuita), `/blog`, `/blog/[slug]`, `/blog/categoria/[cat]`, `/opiniones`,
`/aviso-legal`, `/privacidad`, `/cookies`, `/reserva/confirmada`, `404`.
Secciones del inicio (orden de la maqueta): hero + tarjeta de oferta, «¿Te pasa alguna de estas cosas?», pasos,
**reserva**, servicios, software propio, nosotros, opiniones, últimas noticias, banda CTA, pie.

## Reservas (pieza crítica)
Objetivo: el visitante ve huecos **reales** del calendario de Google de Estudio Seijo, elige día, hora y modalidad
(videoconferencia o presencial en Betanzos), deja sus datos y la reunión queda **creada en Google Calendar** con invitación.

Diseño técnico:
1. `GET /api/disponibilidad?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` → consulta `freebusy` de Google Calendar y devuelve
   huecos libres según reglas configurables: días laborables, franjas, duración (60 min), margen entre citas,
   antelación mínima (24 h), horizonte (60 días), festivos (`config/festivos.json`). Zona horaria `Europe/Madrid`.
2. `POST /api/reservas` → valida en servidor (zod), **vuelve a comprobar** que el hueco sigue libre, crea el evento
   (`events.insert`) con el cliente como invitado, Google Meet si es videoconferencia (`conferenceData`) o la
   dirección si es presencial, y envía email de confirmación al cliente + aviso interno.
3. Anti-spam: Cloudflare Turnstile (o reCAPTCHA v3) + *honeypot* + límite de peticiones por IP.
4. Autenticación con Google: si la cuenta es **Google Workspace**, cuenta de servicio con delegación de dominio;
   si es Gmail personal, OAuth con *refresh token* guardado como secreto. Documenta los pasos en el README.
5. Plan B configurable: si no hay credenciales, mostrar la **agenda de citas de Google** (enlace o iframe) en su lugar.
6. Al confirmar: página `/reserva/confirmada` con resumen y evento GA4 `reserva_confirmada`.
La lógica de cálculo de huecos va en un módulo puro con **tests unitarios** (festivos, fines de semana, solapes,
cambio de hora de octubre y marzo).

## Blog
- Migra los 6 artículos de `referencia/contenidos/blog-migracion.md` con su fecha y categoría, y crea las
  **redirecciones 301** desde las URL antiguas `/noticia/...` (cuidado con los caracteres codificados `%BF`, `%3A`).
- Los 2 artículos marcados como «borrador» van como `draft: true` (no se publican).
- Categorías: Web y ecommerce, SEO y captación, Analítica y datos, Normativa y cumplimiento, Automatización e IA,
  Software de gestión.
- Cada artículo: imagen o composición geométrica de su categoría, autor, fecha, tiempo de lectura, CTA a la reserva.

## Opiniones
- **Nunca inventes reseñas ni nombres de clientes.** Mantén los huecos «Pendiente» hasta tener reseñas reales.
- Estructura preparada para cargarlas desde un archivo de datos (y, más adelante, desde Google Business Profile).
- Botón «Escribir una reseña en Google» con el enlace de la ficha (variable de configuración).

## RGPD, cookies y legal
- Consentimiento explícito y no premarcado en formularios; enlace a privacidad; finalidad y responsable visibles.
- Banner de cookies con Google Consent Mode v2 si se usa GA4; sin cookies no esenciales antes del consentimiento.
- Textos legales: los aporta Estudio Seijo (ver pendientes). Mientras tanto, plantilla marcada como pendiente.

## SEO y analítica
- Metadatos por página, Open Graph, `schema.org` (ProfessionalService, BlogPosting, BreadcrumbList), `sitemap.xml`,
  `robots.txt`, canonical, `hreflang` no necesario (solo español).
- GA4 con eventos: `reserva_iniciada`, `reserva_confirmada`, `click_whatsapp`, `click_telefono`.
- Alta en Search Console tras publicar y envío del sitemap.

## Criterios de calidad (definición de terminado)
- Responsive desde 360 px sin scroll horizontal. Fiel a la maqueta en escritorio y móvil.
- Accesibilidad WCAG 2.2 AA: contraste, foco visible, navegación por teclado del calendario, etiquetas en formularios.
- Lighthouse ≥ 90 en Rendimiento, Accesibilidad, Buenas prácticas y SEO (móvil).
- Tests: unitarios de la lógica de huecos y validaciones; e2e con Playwright del flujo de reserva completo (con mocks
  de Google en CI).
- README con instalación, variables de entorno, configuración de Google, despliegue y cómo publicar en el blog.

## Forma de trabajo
- Fases: 1 arranque · 2 maquetación · 3 blog y CMS · 4 reservas · 5 formularios, RGPD y legal · 6 SEO y analítica ·
  7 QA y publicación. Antes de cada fase, propón el plan y espera el OK. Al terminar, resume lo hecho, cómo probarlo
  y lo pendiente.
- Una rama por fase, commits pequeños y descriptivos en español, *pull request* al cerrar cada fase.
- Si falta un dato (claves, accesos, textos legales, enlaces de Google), pídelo; no lo inventes ni lo dejes «de ejemplo»
  sin marcarlo claramente como pendiente.
