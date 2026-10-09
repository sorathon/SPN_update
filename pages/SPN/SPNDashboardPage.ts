import { expect, type Page } from "@playwright/test";
export class SPNDashboardPage {
  constructor(readonly page: Page) {}
  get content() {
    return this.page.frameLocator("#infrm");
  }
  get updateLink() {
    return this.content
      .getByRole("link", { name: "Update", exact: true })
      .and(this.content.locator('a[href*="ACTION=SMART_UPDATE"]'));
  }
  async expectLoaded() {
    await expect(this.updateLink).toBeVisible();
  }
  async clickUpdate() {
    await this.expectLoaded();
    await this.updateLink.click();
  }
}
