/**
 * Comportamiento de la reserva en el navegador: calendario accesible con teclado, horas, modalidad,
 * validación y envío provisional por WhatsApp o email (maqueta). La lógica pura está en src/lib/reservas.
 */
import { contacto, sitio } from '@/config/sitio';
import type { Disponibilidad } from '@/lib/reservas/disponibilidad-provisional';
import {
  diaSemana,
  diasDelMes,
  etiquetaDia,
  etiquetaMes,
  hoyEn,
  mesDe,
  sumarDias,
  sumarMeses,
  type FechaISO,
} from '@/lib/reservas/fechas';
import { proveedorProvisional, type ProveedorDisponibilidad } from '@/lib/reservas/proveedor';
import {
  enlaceEmail,
  enlaceWhatsapp,
  resumenSeleccion,
  textoSolicitud,
  validarSolicitud,
  type CampoConError,
  type DatosSolicitud,
} from '@/lib/reservas/solicitud';

interface Estado {
  mes: string;
  fecha: FechaISO | null;
  hora: string | null;
  modalidad: string;
  /** Día que recibe el foco con el teclado dentro del calendario. */
  foco: FechaISO | null;
}

const $ = <T extends HTMLElement>(selector: string, raiz: ParentNode = document) =>
  raiz.querySelector<T>(selector);

export async function iniciarReserva(proveedor: ProveedorDisponibilidad = proveedorProvisional) {
  const panel = $('#booking-widget');
  if (!panel) return; // Plan B (agenda de Google) o página sin reserva

  const hoy = hoyEn(new Date(), sitio.zonaHoraria);
  const rango = proveedor.rango(hoy);
  const disponibilidad: Disponibilidad = await proveedor.huecos(hoy, rango.desde, rango.hasta);
  const diasLibres = Object.keys(disponibilidad).sort();

  // «Próximo hueco libre» de la tarjeta de oferta
  const primero = diasLibres[0];
  document.querySelectorAll<HTMLElement>('[data-proximo-hueco]').forEach((el) => {
    el.textContent = primero ? `${etiquetaDia(primero)}, ${disponibilidad[primero][0]} h` : 'Consúltanos';
  });

  const rejilla = $('#cal-grid')!;
  const etiquetaMesEl = $('#cal-month')!;
  const anterior = $<HTMLButtonElement>('#cal-prev')!;
  const siguiente = $<HTMLButtonElement>('#cal-next')!;
  const cajaHoras = $('#slots')!;
  const bloqueHoras = $('#slots-wrap')!;
  const sinDia = $('#no-day')!;
  const etiquetaDiaEl = $('#day-label')!;
  const resumen = $('#summary')!;
  const enviar = $<HTMLButtonElement>('#submit')!;
  const formulario = $<HTMLFormElement>('#booking-form')!;
  const error = $('#form-error')!;
  const hecho = $('#booking-done')!;

  const primerMes = mesDe(rango.desde);
  const ultimoMes = mesDe(rango.hasta);
  const estado: Estado = {
    mes: primero ? mesDe(primero) : primerMes,
    fecha: null,
    hora: null,
    modalidad: $('.mode[aria-pressed="true"]')?.dataset.modalidad ?? 'Videoconferencia',
    foco: null,
  };

  const libre = (fecha: FechaISO) => (disponibilidad[fecha]?.length ?? 0) > 0;

  /** Siguiente día libre en la dirección indicada (o null si no hay más en el horizonte). */
  function siguienteLibre(desde: FechaISO, paso: number): FechaISO | null {
    for (let f = sumarDias(desde, paso); f >= rango.desde && f <= rango.hasta; f = sumarDias(f, paso)) {
      if (libre(f)) return f;
    }
    return null;
  }

  /** La propia fecha si está libre; si no, el siguiente día libre en la dirección indicada. */
  function libreDesde(fecha: FechaISO, paso: number): FechaISO | null {
    return libre(fecha) ? fecha : siguienteLibre(fecha, paso);
  }

  function libreMasCercano(fecha: FechaISO): FechaISO | null {
    if (libre(fecha)) return fecha;
    return siguienteLibre(fecha, 1) ?? siguienteLibre(fecha, -1);
  }

  function actualizar() {
    resumen.textContent = resumenSeleccion(estado.fecha, estado.hora, estado.modalidad);
    const completo = Boolean(estado.fecha && estado.hora);
    enviar.setAttribute('aria-disabled', completo ? 'false' : 'true');
    enviar.textContent = completo ? 'Confirmar reunión' : 'Elige día y hora para confirmar';
  }

  function pintarHoras() {
    if (!estado.fecha) {
      bloqueHoras.hidden = true;
      sinDia.hidden = false;
      return;
    }
    bloqueHoras.hidden = false;
    sinDia.hidden = true;
    etiquetaDiaEl.textContent = etiquetaDia(estado.fecha);
    cajaHoras.replaceChildren(
      ...disponibilidad[estado.fecha].map((hora) => {
        const boton = document.createElement('button');
        boton.type = 'button';
        boton.className = 'slot';
        boton.textContent = hora;
        boton.setAttribute('aria-pressed', String(estado.hora === hora));
        boton.addEventListener('click', () => {
          estado.hora = hora;
          pintarHoras();
          actualizar();
          cajaHoras.querySelector<HTMLButtonElement>('[aria-pressed="true"]')?.focus();
        });
        return boton;
      }),
    );
  }

  function pintarCalendario(enfocar = false) {
    etiquetaMesEl.textContent = etiquetaMes(estado.mes);
    rejilla.querySelectorAll('.cal-cell').forEach((n) => n.remove());

    const dias = diasDelMes(estado.mes);
    const huecosAntes = diaSemana(dias[0]) - 1;
    for (let i = 0; i < huecosAntes; i++) {
      const vacio = document.createElement('div');
      vacio.className = 'cal-cell';
      rejilla.appendChild(vacio);
    }

    // Día con tabindex=0 (un solo punto de parada con Tab): el enfocado, el elegido o el primero libre del mes
    const libresMes = dias.filter(libre);
    const tabulable =
      [estado.foco, estado.fecha].find((f): f is FechaISO => !!f && mesDe(f) === estado.mes && libre(f)) ??
      libresMes[0];

    for (const fecha of dias) {
      let celda: HTMLElement;
      if (libre(fecha)) {
        celda = document.createElement('button');
        celda.setAttribute('type', 'button');
        celda.className = 'cal-cell cal-day';
        celda.dataset.fecha = fecha;
        celda.setAttribute('aria-label', `${etiquetaDia(fecha)}, disponible`);
        celda.setAttribute('aria-pressed', String(estado.fecha === fecha));
        celda.setAttribute('aria-describedby', 'cal-ayuda');
        celda.tabIndex = fecha === tabulable ? 0 : -1;
      } else {
        celda = document.createElement('div');
        celda.className = 'cal-cell cal-day off';
        // Día inactivo (sin huecos): WCAG no exige contraste a componentes inactivos; se oculta a lectores de pantalla
        celda.setAttribute('aria-disabled', 'true');
        celda.setAttribute('aria-hidden', 'true');
      }
      celda.textContent = String(Number(fecha.slice(8)));
      rejilla.appendChild(celda);
    }

    anterior.disabled = estado.mes <= primerMes;
    siguiente.disabled = estado.mes >= ultimoMes;

    if (enfocar && tabulable)
      rejilla.querySelector<HTMLButtonElement>(`[data-fecha="${tabulable}"]`)?.focus();
  }

  function elegirDia(fecha: FechaISO) {
    estado.fecha = fecha;
    estado.foco = fecha;
    estado.hora = null;
    pintarCalendario(true);
    pintarHoras();
    actualizar();
  }

  function moverFoco(destino: FechaISO | null) {
    if (!destino) return;
    estado.foco = destino;
    const cambiaMes = mesDe(destino) !== estado.mes;
    estado.mes = mesDe(destino);
    if (cambiaMes) pintarCalendario(true);
    else {
      rejilla.querySelectorAll<HTMLButtonElement>('button.cal-day').forEach((b) => {
        b.tabIndex = b.dataset.fecha === destino ? 0 : -1;
      });
      rejilla.querySelector<HTMLButtonElement>(`[data-fecha="${destino}"]`)?.focus();
    }
  }

  function cambiarMes(meses: number, enfocar = false) {
    const nuevo = sumarMeses(estado.mes, meses);
    if (nuevo < primerMes || nuevo > ultimoMes) return;
    estado.mes = nuevo;
    estado.foco = diasDelMes(nuevo).find(libre) ?? null;
    pintarCalendario(enfocar);
  }

  rejilla.addEventListener('click', (e) => {
    const boton = (e.target as HTMLElement).closest<HTMLButtonElement>('button.cal-day');
    if (boton?.dataset.fecha) elegirDia(boton.dataset.fecha);
  });

  rejilla.addEventListener('keydown', (e) => {
    const actual = (e.target as HTMLElement).closest<HTMLButtonElement>('button.cal-day')?.dataset.fecha;
    if (!actual) return;
    const destinos: Record<string, () => FechaISO | null> = {
      ArrowRight: () => siguienteLibre(actual, 1),
      ArrowLeft: () => siguienteLibre(actual, -1),
      ArrowDown: () => libreMasCercano(sumarDias(actual, 7)),
      ArrowUp: () => libreMasCercano(sumarDias(actual, -7)),
      // Inicio y Fin: primer y último día libre de la semana (buscando hacia dentro de la semana)
      Home: () => libreDesde(sumarDias(actual, 1 - diaSemana(actual)), 1),
      End: () => libreDesde(sumarDias(actual, 7 - diaSemana(actual)), -1),
    };
    if (e.key in destinos) {
      e.preventDefault();
      const destino = destinos[e.key]();
      // Las flechas arriba/abajo no deben saltar a un día más lejano en sentido contrario
      if (
        destino &&
        ((e.key === 'ArrowDown' && destino <= actual) || (e.key === 'ArrowUp' && destino >= actual))
      )
        return;
      moverFoco(destino);
    } else if (e.key === 'PageDown' || e.key === 'PageUp') {
      e.preventDefault();
      cambiarMes(e.key === 'PageDown' ? 1 : -1, true);
    }
  });

  anterior.addEventListener('click', () => cambiarMes(-1));
  siguiente.addEventListener('click', () => cambiarMes(1));

  document.querySelectorAll<HTMLButtonElement>('.mode').forEach((boton) => {
    boton.addEventListener('click', () => {
      estado.modalidad = boton.dataset.modalidad ?? estado.modalidad;
      document.querySelectorAll('.mode').forEach((b) => b.setAttribute('aria-pressed', String(b === boton)));
      actualizar();
    });
  });

  const campos: Record<Exclude<CampoConError, 'fecha'>, string> = {
    nombre: '#r-nombre',
    email: '#r-email',
    privacidad: '#r-privacy',
  };

  function leerDatos(): DatosSolicitud {
    const valor = (id: string) => $<HTMLInputElement>(id)?.value ?? '';
    return {
      fecha: estado.fecha,
      hora: estado.hora,
      modalidad: estado.modalidad,
      nombre: valor('#r-nombre'),
      empresa: valor('#r-empresa'),
      email: valor('#r-email'),
      telefono: valor('#r-tel'),
      mensaje: valor('#r-msg'),
      privacidad: $<HTMLInputElement>('#r-privacy')?.checked ?? false,
    };
  }

  function mostrarHecho(datos: DatosSolicitud & { fecha: FechaISO; hora: string }) {
    const texto = textoSolicitud(datos);
    panel!.hidden = true;
    hecho.hidden = false;
    $('#done-summary')!.textContent = resumenSeleccion(datos.fecha, datos.hora, datos.modalidad);
    $<HTMLAnchorElement>('#wa-link')!.href = enlaceWhatsapp(contacto.whatsapp.numero, texto);
    $<HTMLAnchorElement>('#mail-link')!.href = enlaceEmail(
      contacto.email.visible,
      datos.fecha,
      datos.hora,
      texto,
    );
    $('#copy-box')!.textContent = texto;
    const reducido = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    hecho.scrollIntoView({ behavior: reducido ? 'auto' : 'smooth', block: 'start' });
    hecho.focus({ preventScroll: true });
  }

  formulario.addEventListener('submit', (e) => {
    e.preventDefault();
    error.hidden = true;
    Object.values(campos).forEach((id) => $(id)?.removeAttribute('aria-invalid'));

    const datos = leerDatos();
    const problema = validarSolicitud(datos);
    if (problema) {
      error.textContent = problema.mensaje;
      error.hidden = false;
      if (problema.campo === 'fecha') {
        rejilla.querySelector<HTMLButtonElement>('button.cal-day[tabindex="0"]')?.focus();
      } else {
        const campo = $<HTMLInputElement>(campos[problema.campo]);
        campo?.setAttribute('aria-invalid', 'true');
        campo?.focus();
      }
      return;
    }
    mostrarHecho(datos as DatosSolicitud & { fecha: FechaISO; hora: string });
  });

  $('#copy-btn')!.addEventListener('click', async (e) => {
    const boton = e.currentTarget as HTMLButtonElement;
    const caja = $('#copy-box')!;
    try {
      await navigator.clipboard.writeText(caja.textContent ?? '');
      boton.textContent = 'Copiado';
      setTimeout(() => (boton.textContent = 'Copiar texto'), 1800);
    } catch {
      // Sin acceso al portapapeles: se selecciona el texto para copiarlo a mano
      const seleccion = window.getSelection();
      const rango = document.createRange();
      rango.selectNodeContents(caja);
      seleccion?.removeAllRanges();
      seleccion?.addRange(rango);
    }
  });

  $('#again')!.addEventListener('click', () => {
    estado.fecha = null;
    estado.hora = null;
    hecho.hidden = true;
    panel.hidden = false;
    pintarCalendario();
    pintarHoras();
    actualizar();
    rejilla.querySelector<HTMLButtonElement>('button.cal-day[tabindex="0"]')?.focus();
  });

  pintarCalendario();
  pintarHoras();
  actualizar();
}
