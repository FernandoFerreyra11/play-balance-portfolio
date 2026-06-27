import { test, expect } from '@playwright/test';
import { RegisterPage } from '../pages/RegisterPage';

test.describe('Flujo de Registro - Rol Familia', () => {
  let registerPage: RegisterPage;

  test.beforeEach(async ({ page }) => {
    registerPage = new RegisterPage(page);
    await registerPage.goToRegister();
  });

  // --- Pruebas Positivas ---
  
  test('[TEST-01] Registro exitoso con datos válidos (Familia)', async ({ page }) => {
    const uniqueEmail = `juan_${Date.now()}@test.com`;
    await registerPage.fillBasicInfo('Juan Perez', uniqueEmail, 'Segura123!');
    await registerPage.setRole('Familia');
    await registerPage.submit();

    // Verificamos que redirige o muestra éxito (en este caso el flujo actual redirige a login con querystring)
    await expect(page).toHaveURL(/.*login.*/);
  });

  test('[TEST-02] Registro exitoso con código opcional (Familia)', async ({ page }) => {
    const uniqueEmail = `ana_${Date.now()}@test.com`;
    await registerPage.fillBasicInfo('Ana Gómez', uniqueEmail, 'Segura123!');
    await registerPage.setRole('Familia');
    // Llenar campo opcional con un código válido existente en la DB (creado por seed-test-data.ts)
    await registerPage.inputFamilyCode.fill('TEST-001');
    await registerPage.submit();

    await expect(page).toHaveURL(/.*login.*/);
  });

  // --- Pruebas Negativas ---

  test('[TEST-03] Intento de registro con contraseña demasiado corta (Familia)', async () => {
    await registerPage.fillBasicInfo('Carlos Ruiz', 'carlos@test.com', '123');
    await registerPage.setRole('Familia');
    await registerPage.submit();

    // Como usamos validación HTML5 (minLength=6), el form no se envía.
    // Podemos validar que el campo sigue ahí.
    await expect(registerPage.btnSubmit).toBeVisible();
  });

  test('[TEST-04] Intento de registro con un correo electrónico ya existente (Familia)', async () => {
    // 'existe@test.com' fue seedeado por nuestro script
    await registerPage.fillBasicInfo('Usuario Existente', 'existe@test.com', 'Segura123!');
    await registerPage.setRole('Familia');
    await registerPage.submit();

    await expect(registerPage.errorMsg).toBeVisible();
    await expect(registerPage.errorMsg).toContainText('correo');
  });
});
