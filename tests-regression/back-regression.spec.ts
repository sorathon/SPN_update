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

for (const root of ['https://first.example/app-one/', 'https://second.example/another/application/']) {
  test('Update and Back work with environment ' + root, async ({ page }) => {
    const list = '<div>Gateway Status</div><button>Check</button><button>Update All</button><div>Patch Date</div>' +
      '<table><tr><td>2026-10-09</td><td>Test patch</td><td>Critical</td><td>Description</td>' +
      '<td><a href="apply.php?PATCHID=7">Update</a></td></tr></table>';
    await page.route(root + '**', async route => {
      const url = new URL(route.request().url());
      let html = list;
      if (url.pathname.endsWith('shell.php')) html = '<iframe id="infrm" name="infrm" src="list.php"></iframe>';
      if (url.pathname.endsWith('apply.php')) html = '<div>Update Status: Success</div> <p>Process 1 / 3 Successful Update</p>' +
        '<button onclick="location.href=\'list.php\'">BACK</button>';
      await route.fulfill({ contentType: 'text/html', body: html });
    });
    await page.goto(root + 'shell.php');
    const update = new SPNUpdatePage(page);
    await update.expectLoaded();
    const fullUrl = await update.hoverUpdateAndGetUrl();
    expect(fullUrl).toBe(root + 'apply.php?PATCHID=7');
    expect((await update.readPatch(fullUrl)).patchId).toBe('7');
    await update.clickUpdateAndWait(fullUrl, 2000);
    await update.clickBack();
    await expect(update.patchUpdateLinks).toHaveCount(1);
  });
}
