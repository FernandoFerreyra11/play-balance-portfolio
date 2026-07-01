import { Locator, Page } from '@playwright/test';
import { BasePage } from './BasePage';

export class RegisterPage extends BasePage {
  // Locators
  readonly inputName: Locator;
  readonly inputEmail: Locator;
  readonly inputPassword: Locator;
  readonly inputFamilyCode: Locator;
  readonly inputLicenseNumber: Locator; // PASO 5 (Testing): Le enseñamos al robot dónde encontrar el nuevo input
  readonly btnRoleParent: Locator;
  readonly btnRoleProfessional: Locator;
  readonly btnSubmit: Locator;
  readonly errorMsg: Locator;

  constructor(page: Page) {
    super(page);
    this.inputName = page.locator('input[name="name"]');
    this.inputEmail = page.locator('input[name="email"]');
    this.inputPassword = page.locator('input[name="password"]');
    this.inputFamilyCode = page.locator('input[name="familyCode"]');
    this.inputLicenseNumber = page.locator('input[name="licenseNumber"]'); // Instanciamos el locator
    this.btnRoleParent = page.getByRole('button', { name: 'Familia' });
    this.btnRoleProfessional = page.getByRole('button', { name: 'Profesional' });
    this.btnSubmit = page.locator('button[type="submit"]');
    // En la UI de Next.js el error es un p con color danger
    this.errorMsg = page.locator('p').filter({ hasText: /correo|contraseña/i });
  }

  async goToRegister() {
    await this.navigate('/register');
  }

  async fillBasicInfo(name: string, email: string, pass: string) {
    await this.inputName.fill(name);
    await this.inputEmail.fill(email);
    await this.inputPassword.fill(pass);
  }

  async setRole(roleValue: 'Familia' | 'Profesional') {
    if (roleValue === 'Familia') {
      await this.btnRoleParent.click();
    } else {
      await this.btnRoleProfessional.click();
    }
  }

  async submit() {
    await this.btnSubmit.click();
  }
}
