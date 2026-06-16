import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class LandingPage extends BasePage {
  // Locators
  readonly navLogo: Locator;
  readonly btnRegisterNav: Locator;
  readonly btnLoginNav: Locator;
  readonly heroSubtitle: Locator;
  readonly btnCtaBottom: Locator;

  constructor(page: Page) {
    super(page);
    this.navLogo = page.locator('.nav-logo');
    this.btnRegisterNav = page.locator('.nav-actions .nav-btn');
    this.btnLoginNav = page.locator('.nav-actions .nav-btn-secondary');
    this.heroSubtitle = page.locator('.hero-subtitle');
    this.btnCtaBottom = page.locator('.cta-btn');
  }

  async goToLanding() {
    await this.navigate('/');
  }

  async clickRegister() {
    await this.btnRegisterNav.click();
  }

  async clickLogin() {
    await this.btnLoginNav.click();
  }
}
