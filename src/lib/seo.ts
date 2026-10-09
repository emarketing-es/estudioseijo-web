/**
 * Datos estructurados schema.org (JSON-LD). Funciones puras: reciben datos y devuelven objetos listos para
 * serializar en <script type="application/ld+json">.
 */
import { contacto, sitio } from '@/config/sitio';

type Esquema = Record<string, unknown>;

/** URL absoluta; las páginas llevan barra final, igual que su canonical y el sitemap (no los archivos). */
function absoluta(ruta: string): string {
  const esArchivo = /\.[a-z0-9]+$/i.test(ruta);
  return new URL(esArchivo || ruta.endsWith('/') ? ruta : `${ruta}/`, sitio.url).toString();
}
const ID_EMPRESA = `${sitio.url}/#empresa`;

/** Estudio Seijo como servicio profesional (portada). Ampliado desde el JSON-LD de la maqueta. */
export function esquemaEmpresa(): Esquema {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': ID_EMPRESA,
    name: sitio.nombre,
    url: `${sitio.url}/`,
    logo: absoluta('/img/logos/logo-estudioseijo.png'),
    image: absoluta('/img/og/estudioseijo.png'),
    telephone: contacto.telefono.e164,
    email: contacto.email.visible,
    address: {
      '@type': 'PostalAddress',
      // PENDIENTE: calle y código postal
      ...(contacto.direccion && { streetAddress: contacto.direccion }),
      addressLocality: contacto.localidad,
      addressRegion: contacto.provincia,
      addressCountry: contacto.pais,
    },
    areaServed: 'ES',
    description:
      'Tecnología, marketing y software para empresas: web y ecommerce, SEO, software de gestión, automatización e IA, datos y cumplimiento digital.',
    makesOffer: {
      '@type': 'Offer',
      name: 'Revisión digital gratuita',
      description:
        'Revisión digital del negocio de aprox. 4 horas, presencial o por videoconferencia, sin compromiso.',
      price: '0',
      priceCurrency: 'EUR',
    },
  };
}

export function esquemaSitioWeb(): Esquema {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: sitio.nombre,
    url: `${sitio.url}/`,
    inLanguage: 'es-ES',
    publisher: { '@id': ID_EMPRESA },
  };
}

export function esquemaMigas(elementos: { nombre: string; ruta: string }[]): Esquema {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: elementos.map((e, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: e.nombre,
      item: absoluta(e.ruta),
    })),
  };
}

export function esquemaArticulo(a: {
  titulo: string;
  resumen: string;
  ruta: string;
  fecha: Date;
  autor: string;
  categoria: string;
  imagen: string;
}): Esquema {
  const fecha = a.fecha.toISOString().slice(0, 10);
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: a.titulo,
    description: a.resumen,
    url: absoluta(a.ruta),
    mainEntityOfPage: absoluta(a.ruta),
    datePublished: fecha,
    dateModified: fecha,
    inLanguage: 'es-ES',
    articleSection: a.categoria,
    image: absoluta(a.imagen),
    author:
      a.autor === sitio.nombre
        ? { '@id': ID_EMPRESA, '@type': 'Organization', name: sitio.nombre }
        : { '@type': 'Person', name: a.autor },
    publisher: {
      '@type': 'Organization',
      '@id': ID_EMPRESA,
      name: sitio.nombre,
      logo: absoluta('/img/logos/logo-estudioseijo.png'),
    },
  };
}

/** JSON seguro dentro de <script>: escapa «<» para que el contenido no pueda cerrar la etiqueta. */
export const jsonLd = (esquema: Esquema) => JSON.stringify(esquema).replace(/</g, '\\u003c');
