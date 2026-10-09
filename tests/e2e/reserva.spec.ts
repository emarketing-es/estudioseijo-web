import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

// Viernes 9 de octubre de 2026 a las 10:00 en Madrid. El lunes 12 es festivo: el primer día libre es el martes 13.
const AHORA = new Date('2026-10-09T10:00:00+02:00');

async function abrirReserva(page: Page) {
  await page.clock.setFixedTime(AHORA);
  await page.goto('/#reserva');
  await expect(page.locator('#cal-month')).toHaveText('Octubre 2026');
}

const dia = (page: Page, etiqueta: string) => page.getByRole('button', { name: `${etiqueta}, disponible` });

test('la tarjeta de oferta muestra el próximo hueco libre', async ({ page }) => {
  await abrirReserva(page);
  await expect(page.locator('[data-proximo-hueco]')).toHaveText('Martes 13 de octubre, 09:30 h');
});

test('solo se pueden elegir días laborables, no festivos, desde mañana', async ({ page }) => {
  await abrirReserva(page);
  await expect(dia(page, 'Viernes 9 de octubre')).toHaveCount(0); // hoy
  await expect(dia(page, 'Lunes 12 de octubre')).toHaveCount(0); // festivo
  await expect(dia(page, 'Sábado 17 de octubre')).toHaveCount(0);
  await expect(dia(page, 'Martes 13 de octubre')).toBeVisible();
  await expect(page.locator('#cal-prev')).toBeDisabled();
});

test('flujo completo: día, hora, modalidad, datos y solicitud por WhatsApp o email', async ({ page }) => {
  await abrirReserva(page);
  await dia(page, 'Miércoles 14 de octubre').click();
  await expect(page.locator('#summary')).toHaveText('Miércoles 14 de octubre · elige una hora');
  await page.getByRole('button', { name: '11:00' }).click();
  await page.getByRole('button', { name: 'Presencial en Betanzos' }).click();
  await expect(page.locator('#summary')).toHaveText(
    'Miércoles 14 de octubre · 11:00 h · Presencial en Betanzos',
  );
  await expect(page.locator('#submit')).toHaveText('Confirmar reunión');

  await page.getByLabel('Nombre y apellidos').fill('Ana Pérez');
  await page.getByLabel('Email').fill('ana@ejemplo.es');
  await page.getByRole('button', { name: 'Confirmar reunión' }).click();
  await expect(page.locator('#form-error')).toHaveText('Para reservar, acepta la política de privacidad.');
  await expect(page.locator('#r-privacy')).toBeFocused();

  await page.getByLabel(/Acepto la política de privacidad/).check();
  await page.getByRole('button', { name: 'Confirmar reunión' }).click();

  const hecho = page.locator('#booking-done');
  await expect(hecho).toBeVisible();
  await expect(hecho).toBeFocused();
  await expect(page.locator('#done-summary')).toHaveText(
    'Miércoles 14 de octubre · 11:00 h · Presencial en Betanzos',
  );
  const wa = await page.locator('#wa-link').getAttribute('href');
  expect(wa).toContain('https://wa.me/34633923567?text=');
  expect(decodeURIComponent(wa!.split('text=')[1])).toContain('Fecha: Miércoles 14 de octubre a las 11:00 h');
  expect(await page.locator('#mail-link').getAttribute('href')).toMatch(
    /^mailto:info@estudioseijo\.com\?subject=/,
  );
  await expect(page.locator('#copy-box')).toContainText('Nombre: Ana Pérez');

  const accesibilidad = await new AxeBuilder({ page }).include('#reserva').analyze();
  expect(accesibilidad.violations.map((v) => v.id)).toEqual([]);

  await page.getByRole('button', { name: 'Elegir otra fecha' }).click();
  await expect(page.locator('#booking-widget')).toBeVisible();
  await expect(page.locator('#summary')).toHaveText('Elige día y hora en el calendario');
});

test('valida el email antes de preparar la solicitud', async ({ page }) => {
  await abrirReserva(page);
  await dia(page, 'Martes 13 de octubre').click();
  await page.getByRole('button', { name: '09:30' }).click();
  await page.getByLabel('Nombre y apellidos').fill('Ana');
  await page.getByLabel('Email').fill('ana@ejemplo');
  await page.locator('#submit').click();
  await expect(page.locator('#form-error')).toHaveText('Revisa el email: parece incompleto.');
  await expect(page.getByLabel('Email')).toHaveAttribute('aria-invalid', 'true');
  await expect(page.locator('#booking-done')).toBeHidden();
});

test('el calendario se maneja con teclado', async ({ page }) => {
  await abrirReserva(page);
  // Un único punto de parada con Tab: el primer día libre
  const tabulables = page.locator('#cal-grid button[tabindex="0"]');
  await expect(tabulables).toHaveCount(1);
  await expect(tabulables).toHaveAttribute('data-fecha', '2026-10-13');

  await tabulables.focus();
  await page.keyboard.press('ArrowRight');
  await expect(dia(page, 'Miércoles 14 de octubre')).toBeFocused();
  await page.keyboard.press('End');
  await expect(dia(page, 'Viernes 16 de octubre')).toBeFocused();
  await page.keyboard.press('ArrowRight'); // salta el fin de semana
  await expect(dia(page, 'Lunes 19 de octubre')).toBeFocused();
  await page.keyboard.press('ArrowDown');
  await expect(dia(page, 'Lunes 26 de octubre')).toBeFocused();
  await page.keyboard.press('ArrowDown'); // cambia de mes
  await expect(page.locator('#cal-month')).toHaveText('Noviembre 2026');
  await expect(dia(page, 'Lunes 2 de noviembre')).toBeFocused();
  await page.keyboard.press('PageUp');
  await expect(page.locator('#cal-month')).toHaveText('Octubre 2026');
  await expect(dia(page, 'Martes 13 de octubre')).toBeFocused();

  await page.keyboard.press('Enter');
  await expect(dia(page, 'Martes 13 de octubre')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('#day-label')).toHaveText('Martes 13 de octubre');
});

test('no se puede pasar del horizonte de 60 días', async ({ page }) => {
  await abrirReserva(page);
  await page.locator('#cal-next').click();
  await page.locator('#cal-next').click();
  await expect(page.locator('#cal-month')).toHaveText('Diciembre 2026');
  await expect(page.locator('#cal-next')).toBeDisabled();
  await expect(dia(page, 'Lunes 7 de diciembre')).toBeVisible();
  await expect(dia(page, 'Martes 8 de diciembre')).toHaveCount(0); // festivo
  await expect(dia(page, 'Miércoles 9 de diciembre')).toHaveCount(0); // fuera del horizonte
});
