import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';

test.describe('Flujo de Registro - Rol Profesional', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goToRegister();
  });

  // --- Pruebas Positivas ---

  test('[TEST-05] Registro exitoso con datos básicos (Profesional)', async ({ page }) => {
    const uniqueEmail = `dr.lopez_${Date.now()}@test.com`;
    await registerPage.fillBasicInfo('Dr. López', uniqueEmail, 'PassFuerte99!');
    await registerPage.setRole('Profesional');
    await registerPage.submit();

    await expect(page).toHaveURL(/.*login.*/);
  });

  // --- Pruebas Negativas ---

  test('[TEST-06] Intento de registro con contraseña demasiado corta (Profesional)', async () => {
    await registerPage.fillBasicInfo('Lic. Pérez', 'lic.perez@test.com', '123');
    await registerPage.setRole('Profesional');
    await registerPage.submit();

    // Como usamos validación HTML5 (minLength=6), el form no se envía.
    await expect(registerPage.btnSubmit).toBeVisible();
  });

  test('[TEST-07] Intento de registro sin email (Profesional)', async () => {
    // FillBasicInfo pero con email vacío
    await registerPage.fillBasicInfo('Dra. Sánchez', '', 'PassFuerte99!');
    await registerPage.setRole('Profesional');
    await registerPage.submit();

    // Validación HTML5 de required
    await expect(registerPage.btnSubmit).toBeVisible();
  });
});
