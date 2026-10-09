import { defineConfig } from '@playwright/test';
import config from '../playwright.config';
export default defineConfig({ ...config, testDir: '.', outputDir: '../test-results-regression', reporter: 'list' });
