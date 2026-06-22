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
    await registerPage.fillBasicInfo('Juan Perez', 'juan.familia@test.com', 'Segura123!');
    await registerPage.setRole('Familia');
    await registerPage.acceptTerms();
    await registerPage.submit();

    // Verificamos que redirige o muestra éxito
    await expect(page).toHaveURL(/.*dashboard/);
  });

  test('[TEST-02] Registro exitoso omitiendo campos opcionales (Familia)', async ({ page }) => {
    // Solo se proveen los campos obligatorios estrictos
    await registerPage.fillBasicInfo('Ana Gómez', 'ana.familia@test.com', 'Segura123!');
    await registerPage.setRole('Familia');
    await registerPage.submit();

    await expect(page).toHaveURL(/.*dashboard/);
  });

  // --- Pruebas Negativas ---

  test('[TEST-03] Intento de registro con contraseñas que no coinciden (Familia)', async () => {
    await registerPage.fillBasicInfo('Carlos Ruiz', 'carlos@test.com', 'Pass123', 'Pass456');
    await registerPage.setRole('Familia');
    await registerPage.submit();

    await expect(registerPage.errorMsg).toBeVisible();
    await expect(registerPage.errorMsg).toContainText('Las contraseñas no coinciden');
  });

  test('[TEST-04] Intento de registro con un correo electrónico ya existente (Familia)', async () => {
    // Asumimos que 'existe@test.com' ya está en la DB
    await registerPage.fillBasicInfo('Usuario Existente', 'existe@test.com', 'Segura123!');
    await registerPage.setRole('Familia');
    await registerPage.acceptTerms();
    await registerPage.submit();

    await expect(registerPage.errorMsg).toBeVisible();
    await expect(registerPage.errorMsg).toContainText('correo ya está en uso');
  });
});
