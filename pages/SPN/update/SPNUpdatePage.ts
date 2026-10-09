import { expect, type Page } from '@playwright/test';

export class SPNUpdatePage {
  constructor(readonly page: Page) {}
  get content() { return this.page.frameLocator('#infrm'); }
  get gatewayStatus() { return this.content.getByText('Gateway Status', { exact: true }); }
  get checkButton() { return this.content.getByRole('button', { name: 'Check', exact: true }); }
  get updateAllButton() { return this.content.getByRole('button', { name: 'Update All', exact: true }); }
  get patchDateHeader() { return this.content.getByText('Patch Date', { exact: true }); }
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
    await expect.poll(() => this.page.frame({ name: 'infrm' })?.url()).toMatch(/ACTION=SMART_UPDATE/i);
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
    const url = new URL(fullUrl);
    expect(url.origin).toBe('https://spnb.nbgwhosting.com');
    expect(url.pathname).toBe('/QA/IE5DEV.shippingnet/data_defaulttemplate.php');
    expect(url.searchParams.get('SERVICENAME')?.toUpperCase()).toBe('IMCORESERVICE');
    expect(url.searchParams.get('ACTION')).toBe('SMART_UPDATE');
    expect(url.searchParams.get('UID')).toBeTruthy();
    expect(url.searchParams.get('UCODE')).toBeTruthy();
    expect(url.searchParams.get('PATCHID')).toMatch(/^\d+$/);
    if (patchId) expect(url.searchParams.get('PATCHID')).toBe(patchId);
    return fullUrl;
  }
  async clickUpdateAndWait(fullUrl: string, timeout = 300_000) {
    const patchId = new URL(fullUrl).searchParams.get('PATCHID');
    if (!patchId) throw new Error('Missing PATCHID');
    const link = this.patchUpdateLink(patchId);
    await expect.poll(() => link.evaluate(element => (element as HTMLAnchorElement).href)).toBe(fullUrl);
    await link.click({ noWaitAfter: true });
    await expect.poll(() => this.page.frame({ name: 'infrm' })?.url(), { timeout }).toBe(fullUrl);
    await this.waitForUpdateCompleted(timeout);
  }
  async waitForUpdateCompleted(timeout = 300_000) {
    const deadline = Date.now() + timeout;
    const remaining = () => Math.max(1, deadline - Date.now());
    const body = this.content.locator('body');
    // Observed QA result: Update Status: Success + Process 1 / 1 Successful Update.
    await expect(body).toContainText(/Update Status:\s*Success\b/i, { timeout: remaining() });
    await expect(body).toContainText(/Successful Update/i, { timeout: remaining() });
    await expect.poll(async () => {
      const text = await body.innerText();
      const process = text.match(/Process\s+(\d+)\s*\/\s*(\d+)/i);
      return !!process && Number(process[2]) > 0 && Number(process[1]) === Number(process[2]);
    }, { timeout: remaining(), message: 'Wait for all update processes to complete successfully' }).toBe(true);
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
    await this.content.getByRole('button', { name: /^BACK$/i }).click();
    await this.expectLoaded();
  }
}
