import { test as base } from '@playwright/test';
import { users } from '../data/users';
import { SPNLoginPage } from '../pages/SPN/SPNLoginPage';
import { SPNDashboardPage } from '../pages/SPN/SPNDashboardPage';
import { SPNUpdatePage } from '../pages/SPN/update/SPNUpdatePage';
type Fixtures = {
  SPNLoginPage: SPNLoginPage;
  SPNDashboardPage: SPNDashboardPage;
  SPNUpdatePage: SPNUpdatePage;
  loggedInAs: () => Promise<void>;
};
export const test = base.extend<Fixtures>({
  SPNLoginPage: async ({ page }, use) => { await use(new SPNLoginPage(page)); },
  SPNDashboardPage: async ({ page }, use) => { await use(new SPNDashboardPage(page)); },
  SPNUpdatePage: async ({ page }, use) => { await use(new SPNUpdatePage(page)); },
  loggedInAs: async ({ SPNLoginPage, SPNDashboardPage }, use) => {
    await use(async () => {
      await SPNLoginPage.navigate();
      await SPNLoginPage.login(users.SPN.username, users.SPN.password);
      await SPNDashboardPage.expectLoaded();
    });
  },
});
export { expect } from '@playwright/test';
