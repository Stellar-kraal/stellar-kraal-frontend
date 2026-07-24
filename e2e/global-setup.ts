/**
 * Global setup for Playwright E2E tests.
 *
 * Responsibilities:
 *  1. Verify the frontend is reachable before running tests.
 *  2. Create snapshot directories if they don't exist.
 *  3. Seed any required environment state.
 */
import { chromium, type FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';

const BASE_URL = process.env.BASE_URL ?? 'http://localhost:3000';
const SNAPSHOT_DIR = path.resolve(__dirname, 'snapshots');

async function globalSetup(config: FullConfig) {
  console.log(`[E2E Setup] Target: ${BASE_URL}`);
  console.log(`[E2E Setup] Snapshot dir: ${SNAPSHOT_DIR}`);

  // Ensure snapshot directories exist
  const snapshotDirs = [
    SNAPSHOT_DIR,
    path.join(SNAPSHOT_DIR, 'chromium'),
  ];
  for (const dir of snapshotDirs) {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      console.log(`[E2E Setup] Created snapshot directory: ${dir}`);
    }
  }

  // Health check — try to reach the frontend
  const browser = await chromium.launch();
  try {
    const page = await browser.newPage();
    await page.goto(BASE_URL, { waitUntil: 'networkidle', timeout: 30_000 });
    const title = await page.title();
    console.log(`[E2E Setup] Frontend reachable — title: "${title}"`);
  } catch (err) {
    console.error(`[E2E Setup] Cannot reach ${BASE_URL}. Is the dev server running?`);
    console.error(`[E2E Setup] Start it with: npm run dev`);
    console.error(`[E2E Setup] Or for Docker: docker compose up --build`);
    throw err;
  } finally {
    await browser.close();
  }

  console.log('[E2E Setup] Complete — ready to run tests.');
}

export default globalSetup;
