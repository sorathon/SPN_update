import { test } from '../../fixtures';

test('SPN01 - QA login form is available', async ({ SPNLoginPage }) => {
  await SPNLoginPage.navigate();
  await SPNLoginPage.expectLoaded();
});
test('SPN02 - Valid login opens dashboard', async ({ loggedInAs }) => {
  await loggedInAs();
});
test('TC01 - Open Smart Update and hover Update for 5 seconds', async ({
  loggedInAs, SPNDashboardPage, SPNUpdatePage, page,
}, testInfo) => {
  await loggedInAs();
  await SPNDashboardPage.clickUpdate();
  await SPNUpdatePage.expectLoaded();
  const fullUrl = await SPNUpdatePage.hoverUpdateAndGetUrl(process.env.SPN_PATCH_ID);
  await testInfo.attach('update-link-url', { body: fullUrl, contentType: 'text/plain' });
  await testInfo.attach('smart-update-hover', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
test('TC02 - Hover Update, apply one patch, and wait for success', async ({
  loggedInAs, SPNDashboardPage, SPNUpdatePage, page,
}, testInfo) => {
  test.setTimeout(360_000);
  await loggedInAs();
  await SPNDashboardPage.clickUpdate();
  await SPNUpdatePage.expectLoaded();
  const fullUrl = await test.step('Hover Update for 5 seconds and verify full URL', async () => {
    return await SPNUpdatePage.hoverUpdateAndGetUrl(process.env.SPN_PATCH_ID);
  });
  await testInfo.attach('update-link-url', { body: fullUrl, contentType: 'text/plain' });
  await test.step('Click the verified patch Update and wait until completed', async () => {
    await SPNUpdatePage.clickUpdateAndWait(fullUrl);
  });
  await testInfo.attach('update-completed', { body: await page.screenshot({ fullPage: true }), contentType: 'image/png' });
});
