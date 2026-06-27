import { Page } from '@playwright/test';

export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  /**
   * Navega a una URL específica
   * @param path Ruta relativa o absoluta
   */
  async navigate(path: string) {
    await this.page.goto(path);
  }

  /**
   * Espera a que la red esté inactiva para asegurar que la página cargó completamente
   */
  async waitForLoadState() {
    await this.page.waitForLoadState('networkidle');
  }
}
