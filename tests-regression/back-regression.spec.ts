import { test, expect } from '@playwright/test';
import { SPNUpdatePage } from '../pages/SPN/update/SPNUpdatePage';

for (const [current, total] of [[1, 1], [2, 3], [3, 3]]) {
  test('Successful patch Process ' + current + ' / ' + total + ' permits Back', async ({ page }) => {
    const result = '<div>Update Status: Success</div><p>Process ' + current + ' / ' + total + ' Successful Update 10000 data(s)</p><button onclick="document.body.innerHTML=\'Patch list\'">BACK</button>';
    await page.setContent('<iframe id="infrm" name="infrm"></iframe>');
    const frame = page.frame({ name: 'infrm' })!;
    await frame.setContent(result);
    const update = new SPNUpdatePage(page);
    await update.waitForUpdateCompleted(2000);
    const metadata = await update.readUpdateResult();
    expect(metadata.completedProcesses).toBe(current);
    expect(metadata.totalProcesses).toBe(total);
    await update.backButton.click();
    await expect(update.content.locator('body')).toHaveText('Patch list');
  });
}
test('Progress without success does not permit completion', async ({ page }) => {
  await page.setContent('<iframe id="infrm" name="infrm"></iframe>');
  await page.frame({ name: 'infrm' })!.setContent('<p>Process 2 / 3 Updating...</p><button>BACK</button>');
  await expect(new SPNUpdatePage(page).waitForUpdateCompleted(500)).rejects.toThrow();
});
