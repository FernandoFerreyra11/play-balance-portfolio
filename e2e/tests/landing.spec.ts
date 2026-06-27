import { test, expect } from '@playwright/test';
import { LandingPage } from '../pages/LandingPage';

test.describe('Landing Page E2E - PoC', () => {
  let landingPage: LandingPage;

  test.beforeEach(async ({ page }) => {
    // Instanciamos el Page Object y navegamos antes de cada test
    landingPage = new LandingPage(page);
    await landingPage.goToLanding();
  });

  test('Debería cargar el logo correctamente en la navegación', async () => {
    // Validación usando los locators definidos en LandingPage.ts
    await expect(landingPage.navLogo).toBeVisible();
    await expect(landingPage.navLogo).toContainText('PlayBalance');
  });

  test('El subtítulo del Hero section debería estar visible', async () => {
    await expect(landingPage.heroSubtitle).toBeVisible();
    await expect(landingPage.heroSubtitle).toContainText('La aventura de crecer, gamificada');
  });

  test('Los botones de Entrar y Registrarse deben ser funcionales', async () => {
    await expect(landingPage.btnRegisterNav).toBeVisible();
    await expect(landingPage.btnLoginNav).toBeVisible();
    
    // Verificamos que los botones tengan los textos correctos
    await expect(landingPage.btnRegisterNav).toContainText('Registrarse');
    await expect(landingPage.btnLoginNav).toContainText('Entrar');
  });
});
