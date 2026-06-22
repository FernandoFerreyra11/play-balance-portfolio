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
    await registerPage.fillBasicInfo('Dr. López', 'dr.lopez@test.com', 'PassFuerte99!');
    await registerPage.setRole('Profesional');
    await registerPage.acceptTerms();
    await registerPage.submit();

    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('[TEST-06] Registro exitoso incluyendo campos opcionales generales (Profesional)', async ({ page }) => {
    await registerPage.fillBasicInfo('Lic. Martínez', 'lic.martinez@test.com', 'PassFuerte99!');
    await registerPage.setRole('Profesional');
    // Llenar campo opcional
    await registerPage.inputOptionalInfo.fill('Psicólogo Infantil');
    await registerPage.acceptTerms();
    await registerPage.submit();

    await expect(page).toHaveURL(/.*dashboard/);
  });

  // --- Pruebas Negativas ---

  test('[TEST-07] Intento de registro sin aceptar términos y condiciones (Profesional)', async () => {
    await registerPage.fillBasicInfo('Dra. Sánchez', 'dra.sanchez@test.com', 'PassFuerte99!');
    await registerPage.setRole('Profesional');
    // No aceptamos los términos
    await registerPage.submit();

    await expect(registerPage.errorMsg).toBeVisible();
    await expect(registerPage.errorMsg).toContainText('Debe aceptar los términos y condiciones');
  });

  test('[TEST-08] Intento de registro con contraseña demasiado corta (Profesional)', async () => {
    await registerPage.fillBasicInfo('Lic. Pérez', 'lic.perez@test.com', '123', '123');
    await registerPage.setRole('Profesional');
    await registerPage.acceptTerms();
    await registerPage.submit();

    await expect(registerPage.errorMsg).toBeVisible();
    await expect(registerPage.errorMsg).toContainText('contraseña debe tener al menos');
  });
});
