import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  // Locators
  readonly inputName: Locator;
  readonly inputEmail: Locator;
  readonly inputPassword: Locator;
  readonly inputConfirmPassword: Locator;
  readonly selectRole: Locator;
  readonly chkTerms: Locator;
  readonly btnSubmit: Locator;
  readonly errorMsg: Locator;
  readonly inputOptionalInfo: Locator;

  constructor(page: Page) {
    super(page);
    this.inputName = page.locator('input[name="name"]');
    this.inputEmail = page.locator('input[name="email"]');
    this.inputPassword = page.locator('input[name="password"]');
    this.inputConfirmPassword = page.locator('input[name="confirmPassword"]');
    this.selectRole = page.locator('select[name="role"]');
    this.chkTerms = page.locator('input[name="terms"]');
    this.btnSubmit = page.locator('button[type="submit"]');
    this.errorMsg = page.locator('.error-message');
    this.inputOptionalInfo = page.locator('input[name="optionalInfo"]');
  }

  async goToRegister() {
    await this.navigate('/register');
  }

  async fillBasicInfo(name: string, email: string, pass: string, confirmPass?: string) {
    await this.inputName.fill(name);
    await this.inputEmail.fill(email);
    await this.inputPassword.fill(pass);
    if (confirmPass) {
      await this.inputConfirmPassword.fill(confirmPass);
    } else {
      await this.inputConfirmPassword.fill(pass);
    }
  }

  async setRole(roleValue: 'Familia' | 'Profesional') {
    await this.selectRole.selectOption(roleValue);
  }

  async acceptTerms() {
    await this.chkTerms.check();
  }

  async submit() {
    await this.btnSubmit.click();
  }
}
