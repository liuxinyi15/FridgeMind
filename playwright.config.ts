import { defineConfig, devices } from '@playwright/test';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const pagesBase = process.env.GITHUB_ACTIONS && repositoryName && !repositoryName.endsWith('.github.io') ? `/${repositoryName}` : '';
const previewPort = Number(process.env.PLAYWRIGHT_PORT ?? 4173);
const baseURL = `http://127.0.0.1:${previewPort}`;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: false,
  use: {
    baseURL,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: {
    command: `./node_modules/.bin/vite preview --host 127.0.0.1 --port ${previewPort}`,
    url: pagesBase ? `${baseURL}${pagesBase}/` : `${baseURL}/`,
    reuseExistingServer: !process.env.CI,
  },
  projects: [
    { name: 'mobile-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium', viewport: { width: 390, height: 844 } } },
  ],
});
