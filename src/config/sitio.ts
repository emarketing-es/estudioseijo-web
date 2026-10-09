/**
 * Datos de la empresa y enlaces del sitio.
 * Es la única fuente de verdad para teléfono, correo, enlaces, etc.: los componentes leen de aquí.
 *
 * Los valores que aún no ha facilitado Estudio Seijo valen `null` y llevan el comentario
 * «PENDIENTE» (ver referencia/contenidos/pendientes.md). No se rellenan con datos de ejemplo.
 */

export const sitio = {
  nombre: 'Estudio Seijo',
  marca: 'estudioseijo.',
  url: 'https://estudioseijo.com',
  lema: 'Tecnología para hacer más fácil tu negocio',
  descripcion:
    'Revisión digital gratuita de tu negocio (aprox. 4 h). Web, SEO, software de gestión, automatización e IA desde Betanzos. Reserva día y hora online.',
  descripcionCorta:
    'Tecnología, marketing y software para empresas. Desde Betanzos, más de 20 años cerca de tu negocio.',
  idioma: 'es',
  locale: 'es_ES',
  zonaHoraria: 'Europe/Madrid',
} as const;

export const contacto = {
  telefono: { visible: '981 774 892', enlace: 'tel:+34981774892', e164: '+34981774892' },
  whatsapp: { visible: '633 923 567', enlace: 'https://wa.me/34633923567', numero: '34633923567' },
  email: { visible: 'info@estudioseijo.com', enlace: 'mailto:info@estudioseijo.com' },
  localidad: 'Betanzos',
  provincia: 'A Coruña',
  pais: 'ES',
  // PENDIENTE: dirección postal para reuniones presenciales.
  direccion: null as string | null,
} as const;

export const google = {
  // PENDIENTE: enlace a la ficha de Google Business Profile.
  fichaUrl: null as string | null,
  // PENDIENTE: enlace «Escribir una reseña» de la ficha.
  resenaUrl: null as string | null,
} as const;

export const legal = {
  // PENDIENTE: titular, NIF y domicilio (los aporta Estudio Seijo / asesoría).
  titular: null as string | null,
  nif: null as string | null,
  domicilio: null as string | null,
} as const;

export interface EnlaceMenu {
  texto: string;
  href: string;
}

/** Menú principal de la cabecera (orden y textos de la maqueta). */
export const menuPrincipal: EnlaceMenu[] = [
  { texto: 'servicios', href: '/#servicios' },
  { texto: 'software', href: '/#software' },
  { texto: 'nosotros', href: '/#nosotros' },
  { texto: 'opiniones', href: '/opiniones' },
  { texto: 'blog', href: '/blog' },
];

/** Columnas del pie (textos de la maqueta). */
export const menuPie: { titulo: string; enlaces: EnlaceMenu[] }[] = [
  {
    titulo: 'Servicios',
    enlaces: [
      { texto: 'Web y comercio electrónico', href: '/#servicios' },
      { texto: 'SEO y captación digital', href: '/#servicios' },
      { texto: 'Software y sistemas de gestión', href: '/#servicios' },
      { texto: 'Automatización e IA', href: '/#servicios' },
      { texto: 'Integraciones y datos', href: '/#servicios' },
      { texto: 'Digitalización y cumplimiento', href: '/#servicios' },
    ],
  },
  {
    titulo: 'Estudio Seijo',
    enlaces: [
      { texto: 'Revisión digital gratuita', href: '/#reserva' },
      { texto: 'Software propio', href: '/#software' },
      { texto: 'Nosotros', href: '/#nosotros' },
      { texto: 'Opiniones', href: '/opiniones' },
      { texto: 'Blog', href: '/blog' },
    ],
  },
];

export const menuLegal: EnlaceMenu[] = [
  { texto: 'Aviso legal', href: '/aviso-legal' },
  { texto: 'Privacidad', href: '/privacidad' },
  { texto: 'Cookies', href: '/cookies' },
];
