import { defineConfig, devices } from "@playwright/test";

// E2E tests drive the gallery in Playwright's Chromium against their own Vite, beside the
// development server. The port is E2E_WEB_PORT (default 5191), so checkouts can run the tests side
// by side by giving each its own. A port that is already in use stops the run
// (reuseExistingServer is not set), so a run never talks to another checkout's server.
function port(name: string, fallback: number): number {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  if (!/^\d+$/.test(value) || Number(value) < 1 || Number(value) > 65535) {
    throw new Error(
      `${name} は数字で指定してください（指定された値: ${value}）。`,
    );
  }
  return Number(value);
}
const webPort = port("E2E_WEB_PORT", 5191);

export default defineConfig({
  testDir: "e2e",
  workers: 1,
  timeout: 60_000,
  expect: {
    timeout: 10_000,
    // Baseline images of the gallery (e2e/gallery.spec.ts) must match pixel for pixel.
    toHaveScreenshot: { maxDiffPixels: 0 },
  },
  snapshotPathTemplate: "{testDir}/__screenshots__/{arg}-{platform}{ext}",
  reporter: [["list"]],
  use: {
    baseURL: `http://localhost:${webPort}`,
    viewport: { width: 1440, height: 900 },
    // Fixed, so the baseline images do not depend on the machine's language.
    locale: "ja-JP",
    // Playwright's own Chromium (npx playwright install chromium), pinned to the Playwright version,
    // so the baseline images do not change when Google Chrome updates itself.
    trace: "retain-on-failure",
  },
  projects: [
    // Desktop (1440×900): the baseline images in e2e/__screenshots__/ that the apps rely on.
    { name: "desktop", testIgnore: /narrow\.spec\.ts/ },
    // A phone (Pixel 7, 412×915), with its own baseline images in e2e/__screenshots__/narrow/. The
    // device pixel ratio stays 1 so the images are as small as the desktop ones. The audits run on
    // the gallery as on the desktop; the audits' own tests (they set their own content) run once.
    {
      name: "narrow",
      use: { ...devices["Pixel 7"], deviceScaleFactor: 1 },
      snapshotPathTemplate:
        "{testDir}/__screenshots__/narrow/{arg}-{platform}{ext}",
      grepInvert: /監査は/,
    },
  ],
  webServer: {
    command: `npx vite --port ${webPort} --strictPort`,
    url: `http://localhost:${webPort}/gallery/`,
  },
});
