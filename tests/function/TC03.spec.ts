import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { test, expect } from '../../fixtures';

test('TC03 - Update up to 3 patches with Back and export patch data', async ({
  loggedInAs, SPNDashboardPage, SPNUpdatePage, page,
}, testInfo) => {
  const maxRounds = 3;
  test.setTimeout(maxRounds * 360_000 + 60_000);
  const runId = new Date().toISOString().replace(/[:.]/g, '-');
  const outputDir = path.resolve('patch-results', runId);
  await mkdir(outputDir, { recursive: true });
  type Record = {
    round: number; patchId: string; patchDate: string; title: string;
    level: string; description: string; updateUrl: string;
    startedAt: string; finishedAt?: string; durationMs?: number;
    status: 'started' | 'success' | 'failed'; resultText?: string;
    completedProcesses?: number | null; totalProcesses?: number | null;
    screenshot?: string; error?: string;
  };
  const records: Record[] = [];
  const summary = { maxRounds, stopReason: 'running', records };
  const columns = ['round', 'patchId', 'patchDate', 'title', 'level', 'description',
    'status', 'startedAt', 'finishedAt', 'durationMs', 'completedProcesses',
    'totalProcesses', 'updateUrl', 'resultText', 'screenshot', 'error'] as const;
  const csvCell = (value: unknown) => '"' + String(value ?? '').replace(/"/g, '""') + '"';
  const save = async () => {
    await writeFile(path.join(outputDir, 'patch-updates.json'), JSON.stringify(summary, null, 2), 'utf8');
    await writeFile(path.join(outputDir, 'patch-updates.csv'), '\uFEFF' + [
      columns.join(','), ...records.map(record => columns.map(key => csvCell(record[key])).join(',')),
    ].join('\r\n'), 'utf8');
  };
  try {
    await loggedInAs();
    await SPNDashboardPage.clickUpdate();
    await SPNUpdatePage.expectLoaded();
    const seen = new Set<string>();
    for (let round = 1; round <= maxRounds; round++) {
      if (await SPNUpdatePage.patchUpdateLinks.count() === 0) {
        const blocked = await SPNUpdatePage.content.getByText('Require previous update', { exact: true }).count();
        if (blocked > 0) throw new Error('Pending patches are blocked; no Update link is available');
        summary.stopReason = 'no-more-patches';
        break;
      }
      await test.step('Round ' + round + ': hover, capture patch, update, and Back', async () => {
        const fullUrl = await SPNUpdatePage.hoverUpdateAndGetUrl();
        const patch = await SPNUpdatePage.readPatch(fullUrl);
        expect(seen.has(patch.patchId), 'Do not click the same patch twice in this run').toBe(false);
        seen.add(patch.patchId);
        const safeUrl = new URL(fullUrl);
        // Session credential is not exported in the CSV/JSON reports.
        safeUrl.searchParams.set('UCODE', '[redacted]');
        const record: Record = {
          round, ...patch, updateUrl: safeUrl.href,
          startedAt: new Date().toISOString(), status: 'started',
        };
        records.push(record);
        await save();
        const started = Date.now();
        try {
          await SPNUpdatePage.clickUpdateAndWait(fullUrl);
          Object.assign(record, await SPNUpdatePage.readUpdateResult());
          record.status = 'success';
          record.finishedAt = new Date().toISOString();
          record.durationMs = Date.now() - started;
          record.screenshot = 'round-' + round + '-patch-' + patch.patchId + '.png';
          await save();
          await page.screenshot({ path: path.join(outputDir, record.screenshot), fullPage: true });
          console.log('Round ' + round + ': PATCHID=' + patch.patchId + ' Success - ' + patch.title);
        } catch (error) {
          // Do not retry an uncertain update: preserve evidence and stop the loop.
          record.status = 'failed';
          record.finishedAt = new Date().toISOString();
          record.durationMs = Date.now() - started;
          record.error = error instanceof Error ? error.message : String(error);
          await save();
          await page.screenshot({ path: path.join(outputDir, 'round-' + round + '-failed.png'), fullPage: true }).catch(() => {});
          throw error;
        }
        await SPNUpdatePage.clickBack();
      });
    }
    if (summary.stopReason === 'running') summary.stopReason = 'round-limit-reached';
  } catch (error) {
    summary.stopReason = 'error';
    throw error;
  } finally {
    await save();
    await testInfo.attach('patch-updates-json', { path: path.join(outputDir, 'patch-updates.json'), contentType: 'application/json' });
    await testInfo.attach('patch-updates-csv', { path: path.join(outputDir, 'patch-updates.csv'), contentType: 'text/csv' });
    console.log('Patch reports: ' + outputDir);
  }
});
