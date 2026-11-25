import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';

const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const githubPagesBase = repositoryName && !repositoryName.endsWith('.github.io') ? `/${repositoryName}/` : '/';

export default defineConfig({
  base: process.env.GITHUB_ACTIONS ? githubPagesBase : '/',
  plugins: [react()],
  // The desktop sandbox uses a hardened Node binary that cannot load the
  // Lightning CSS addon. Normal local and CI builds keep Vite's minification.
  build: { cssMinify: process.execPath.includes('/Applications/ChatGPT.app') ? false : undefined },
  test: {
    environment: 'jsdom',
    setupFiles: './src/test/setup.ts',
    css: true,
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
