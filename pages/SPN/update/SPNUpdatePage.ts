import { expect, type Page } from '@playwright/test';

export class SPNUpdatePage {
  constructor(readonly page: Page) {}
  get content() { return this.page.frameLocator('#infrm'); }
  get gatewayStatus() { return this.content.getByText('Gateway Status', { exact: true }); }
  get checkButton() { return this.content.getByRole('button', { name: 'Check', exact: true }); }
  get updateAllButton() { return this.content.getByRole('button', { name: 'Update All', exact: true }); }
  get patchDateHeader() { return this.content.getByText('Patch Date', { exact: true }); }
  get backButton() { return this.content.getByRole('button', { name: /^BACK$/i }); }
  get patchUpdateLinks() {
    return this.content.getByRole('link', { name: 'Update', exact: true })
      .and(this.content.locator('a[href*="PATCHID="]'));
  }
  patchUpdateLink(patchId?: string) {
    if (!patchId) return this.patchUpdateLinks.first();
    if (!/^\d+$/.test(patchId)) throw new Error('PATCHID must contain digits only');
    return this.patchUpdateLinks.and(this.content.locator('a[href$="PATCHID=' + patchId + '"]'));
  }
  async expectLoaded() {
    await expect(this.gatewayStatus).toBeVisible();
    await expect(this.checkButton).toBeVisible();
    await expect(this.updateAllButton).toBeVisible();
    await expect(this.patchDateHeader).toBeVisible();
  }
  async hoverUpdateAndGetUrl(patchId?: string): Promise<string> {
    const link = this.patchUpdateLink(patchId);
    await expect(link).toBeVisible();
    await link.hover();
    // Required pause for the browser's link preview/status bar.
    await this.page.waitForTimeout(5_000);
    const fullUrl = await link.evaluate(element => (element as HTMLAnchorElement).href);
    // Read the current link for reporting; do not restrict its host/path to one environment.
    return fullUrl;
  }
  async clickUpdateAndWait(fullUrl: string, timeout = 300_000) {
    const patchId = new URL(fullUrl).searchParams.get('PATCHID');
    if (!patchId) throw new Error('Missing PATCHID');
    const link = this.patchUpdateLink(patchId);
    await link.click({ noWaitAfter: true });
    await this.waitForUpdateCompleted(timeout);
  }
  async waitForUpdateCompleted(timeout = 300_000) {
    const deadline = Date.now() + timeout;
    const remaining = () => Math.max(1, deadline - Date.now());
    const body = this.content.locator('body');
    // Process 2 / 3 can identify a successful part of a multi-part patch.
    // It is report metadata, not the completion count of this request.
    await expect(body).toContainText(/Update Status:\s*Success\b/i, { timeout: remaining(), useInnerText: true });
    await expect(body).toContainText(/Successful Update/i, { timeout: remaining(), useInnerText: true });
    await expect(this.backButton).toBeVisible({ timeout: remaining() });
    await expect(this.backButton).toBeEnabled({ timeout: remaining() });
  }
  async readPatch(fullUrl: string) {
    const patchId = new URL(fullUrl).searchParams.get('PATCHID')!;
    const cells = await this.patchUpdateLink(patchId).evaluate(element =>
      Array.from(element.closest('tr')!.cells, cell => cell.innerText.trim()));
    return {
      patchId, patchDate: cells[0] ?? '', title: cells[1] ?? '',
      level: cells[2] ?? '', description: cells[3] ?? '',
    };
  }
  async readUpdateResult() {
    const text = await this.content.locator('body').innerText();
    const process = text.match(/Process\s+(\d+)\s*\/\s*(\d+)/i);
    return {
      resultText: text.trim(),
      completedProcesses: process ? Number(process[1]) : null,
      totalProcesses: process ? Number(process[2]) : null,
    };
  }
  async clickBack() {
    await expect(this.backButton).toBeVisible();
    await expect(this.backButton).toBeEnabled();
    await this.backButton.click();
    await this.expectLoaded();
  }
}
