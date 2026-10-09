/**
 * Textos de las secciones del inicio (aprobados en la maqueta). Cambiar aquí, no en los componentes.
 */
import type { NombreIcono } from '@/components/ui/iconos';

export interface ElementoIcono {
  icono: NombreIcono;
  /** Círculo azul suave en lugar de naranja suave. */
  info?: boolean;
  titulo: string;
  texto?: string;
}

/** «¿Te pasa alguna de estas cosas?» */
export const casos: ElementoIcono[] = [
  { icono: 'repeat', titulo: 'Una tarea que haces una y otra vez.' },
  { icono: 'clock', info: true, titulo: 'Un proceso que te roba demasiado tiempo.' },
  { icono: 'monitor', titulo: 'Una web que podría generar más clientes.' },
  { icono: 'sheet', info: true, titulo: 'Un Excel que empieza a quedarse pequeño.' },
  { icono: 'question', titulo: 'Una nueva obligación digital que no sabes cómo resolver.' },
  { icono: 'link', info: true, titulo: 'Dos herramientas que deberían trabajar juntas.' },
  { icono: 'bulb', titulo: 'Una idea que no sabes si se puede llevar a cabo.' },
  { icono: 'dots', info: true, titulo: '…o cualquier otra cosa que tengas en mente.' },
];

/** Pasos de «Cómo funciona». */
export const pasos = [
  { titulo: 'Elige día y hora', texto: 'Reserva aquí mismo un hueco libre de nuestro calendario.' },
  { titulo: 'Hacemos una reunión', texto: 'Por videoconferencia o presencial, en Betanzos.' },
  { titulo: 'Te escuchamos', texto: 'Estudiamos tu caso y te explicamos qué opciones tienes.' },
];

/** Especialidades (sección «servicios»). */
export const servicios: ElementoIcono[] = [
  {
    icono: 'monitor',
    titulo: 'Web y comercio electrónico',
    texto: 'Diseño y desarrollo de webs, tiendas online, portales B2B y otras plataformas digitales.',
  },
  {
    icono: 'bars',
    info: true,
    titulo: 'SEO y captación digital',
    texto:
      'Posicionamiento en buscadores, publicidad digital y estrategias para generar oportunidades de negocio.',
  },
  {
    icono: 'stack',
    info: true,
    titulo: 'Software y sistemas de gestión',
    texto: 'Soluciones para organizar clientes, proyectos, ventas, facturación, equipos y procesos internos.',
  },
  {
    icono: 'gear',
    titulo: 'Automatización e Inteligencia Artificial',
    texto: 'Automatización de tareas y procesos para reducir trabajo manual y mejorar la productividad.',
  },
  {
    icono: 'share',
    titulo: 'Integraciones, datos y analítica',
    texto: 'Conexión entre herramientas, centralización de información y sistemas de seguimiento y análisis.',
  },
  {
    icono: 'shield',
    info: true,
    titulo: 'Digitalización y cumplimiento',
    texto:
      'Respuesta a nuevas obligaciones digitales y normativas de forma sencilla y adaptada a cada empresa.',
  },
];

/** «Quiénes somos». */
export const motivos: ElementoIcono[] = [
  {
    icono: 'calendar',
    titulo: 'Más de 20 años desarrollando soluciones digitales',
    texto:
      'Nacimos trabajando con empresas gallegas y hemos evolucionado del desarrollo web a proyectos completos de digitalización y sistemas de negocio.',
  },
  {
    icono: 'pin',
    info: true,
    titulo: 'Estamos en Betanzos',
    texto:
      'Puedes hablar directamente con nosotros, reunirnos en persona y tener un equipo técnico cerca cuando lo necesites.',
  },
  {
    icono: 'bulb',
    info: true,
    titulo: 'Estrategia + tecnología',
    texto: 'Primero entendemos el problema. Después buscamos la solución adecuada para cada negocio.',
  },
  {
    icono: 'box',
    titulo: 'Soluciones propias',
    texto:
      'Desarrollamos software y productos propios, además de soluciones a medida e integraciones con otras plataformas.',
  },
  {
    icono: 'people',
    titulo: 'Acompañamiento',
    texto:
      'Implantación, formación, soporte y evolución para que las soluciones se usen de verdad en el día a día.',
  },
  {
    icono: 'bars',
    info: true,
    titulo: 'Resultados que se pueden comprobar',
    texto:
      'Objetivos concretos y medibles: vender y captar más, ahorrar tiempo, reducir errores y tener mejores datos.',
  },
];
