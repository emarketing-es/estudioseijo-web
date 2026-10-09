/**
 * Licencias de software propio (referencia/contenidos/oferta-revision-digital-gratuita.md).
 * Precios «desde», cuota mensual sin IVA. El −10 % para partners NO se publica en la web.
 * `cuota: null` = «Consultar · proyecto a medida».
 */
export interface Licencia {
  nombre: string;
  descripcion: string;
  /** Cuota mensual en euros, sin IVA. */
  cuota: number | null;
}

export const licencias: Licencia[] = [
  { nombre: 'MyCo RJL', descripcion: 'Registro laboral y control horario', cuota: 12.36 },
  { nombre: 'MyCo Facturación', descripcion: 'Facturación y gestión', cuota: 39 },
  { nombre: 'MyCo DeCA', descripcion: 'Carta de porte digital para transporte mediante QR', cuota: 12 },
  {
    nombre: 'MyCo Gestión de Proyectos',
    descripcion: 'Gestión y seguimiento de proyectos y tareas',
    cuota: 39,
  },
  {
    nombre: 'MyCo Academias',
    descripcion: 'Gestión de academias, escuelas y centros de formación',
    cuota: 55,
  },
  { nombre: 'Budyo', descripcion: 'E-commerce en formato SaaS', cuota: 39 },
  { nombre: 'Oatayo', descripcion: 'Seguimiento colaborativo de proyectos cliente-agencia', cuota: 5 },
  { nombre: 'Gestión de cartas', descripcion: 'Cartas digitales para hostelería', cuota: 9 },
  { nombre: 'Leads Manager', descripcion: 'Gestión y seguimiento de leads comerciales', cuota: 12 },
  { nombre: 'Agentes IA', descripcion: 'Agentes de IA a medida para tu negocio', cuota: null },
];

/** 12.36 → «12,36 €/mes»; 39 → «39 €/mes» (formato español, sin decimales si son enteros). */
export function formatoCuota(cuota: number): string {
  const importe = new Intl.NumberFormat('es-ES', {
    minimumFractionDigits: Number.isInteger(cuota) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cuota);
  return `${importe} €/mes`;
}
