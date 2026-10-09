import { expect, type Page } from '@playwright/test';
export class SPNLoginPage {
  constructor(readonly page: Page) {}
  get username() { return this.page.locator('#user'); }
  get password() { return this.page.locator('#passwd'); }
  async navigate() { await this.page.goto('login.php', { waitUntil: 'domcontentloaded' }); }
  async expectLoaded() {
    await expect(this.username).toBeVisible();
    await expect(this.password).toBeVisible();
  }
  async login(username: string, password: string) {
    await this.expectLoaded();
    await this.username.fill(username);
    await this.password.fill(password);
    // QA hides #go; Enter submits the login form through the visible password field.
    await this.password.press('Enter');
    await expect(this.page.locator('#infrm')).toBeVisible();
    await expect(this.page.getByRole('link', { name: 'Logout', exact: true })).toBeVisible();
  }
}
