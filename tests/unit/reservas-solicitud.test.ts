import { describe, expect, it } from 'vitest';
import {
  enlaceEmail,
  enlaceWhatsapp,
  resumenSeleccion,
  textoSolicitud,
  validarSolicitud,
  type DatosSolicitud,
} from '@/lib/reservas/solicitud';

const valida: DatosSolicitud = {
  fecha: '2026-10-13',
  hora: '09:30',
  modalidad: 'Videoconferencia',
  nombre: 'Ana Pérez',
  empresa: '',
  email: 'ana@ejemplo.es',
  telefono: '',
  mensaje: '',
  privacidad: true,
};

describe('validarSolicitud', () => {
  it('acepta una solicitud completa', () => {
    expect(validarSolicitud(valida)).toBeNull();
  });

  it('señala el primer problema en el orden del formulario', () => {
    expect(validarSolicitud({ ...valida, hora: null })?.campo).toBe('fecha');
    expect(validarSolicitud({ ...valida, nombre: '   ' })?.campo).toBe('nombre');
    expect(validarSolicitud({ ...valida, email: 'ana@ejemplo' })?.campo).toBe('email');
    expect(validarSolicitud({ ...valida, privacidad: false })?.campo).toBe('privacidad');
    expect(validarSolicitud({ ...valida, nombre: '', privacidad: false })?.campo).toBe('nombre');
  });
});

describe('textos de la solicitud', () => {
  it('resumen de la selección', () => {
    expect(resumenSeleccion(null, null, 'Videoconferencia')).toBe('Elige día y hora en el calendario');
    expect(resumenSeleccion('2026-10-13', null, 'Videoconferencia')).toBe(
      'Martes 13 de octubre · elige una hora',
    );
    expect(resumenSeleccion('2026-10-13', '09:30', 'Presencial en Betanzos')).toBe(
      'Martes 13 de octubre · 09:30 h · Presencial en Betanzos',
    );
  });

  it('texto mínimo y texto con todos los datos', () => {
    expect(textoSolicitud({ ...valida, fecha: '2026-10-13', hora: '09:30' })).toBe(
      'Hola, quiero reservar la revisión digital gratuita.\n' +
        'Fecha: Martes 13 de octubre a las 09:30 h\n' +
        'Modalidad: Videoconferencia\n' +
        'Nombre: Ana Pérez\n' +
        'Email: ana@ejemplo.es',
    );
    const completo = textoSolicitud({
      ...valida,
      fecha: '2026-10-13',
      hora: '09:30',
      empresa: 'Ferretería Ana',
      telefono: '600 000 000',
      mensaje: 'La web',
    });
    expect(completo).toContain('Nombre: Ana Pérez (Ferretería Ana)');
    expect(completo).toContain('Email: ana@ejemplo.es · Tel.: 600 000 000');
    expect(completo.endsWith('\nQué me gustaría mejorar: La web')).toBe(true);
  });

  it('enlaces de WhatsApp y email codificados', () => {
    expect(enlaceWhatsapp('34633923567', 'Hola & adiós')).toBe(
      'https://wa.me/34633923567?text=Hola%20%26%20adi%C3%B3s',
    );
    const mail = enlaceEmail('info@estudioseijo.com', '2026-10-13', '09:30', 'Hola');
    expect(mail.startsWith('mailto:info@estudioseijo.com?subject=Reserva%20revisi%C3%B3n')).toBe(true);
    expect(mail.endsWith('&body=Hola')).toBe(true);
  });
});
