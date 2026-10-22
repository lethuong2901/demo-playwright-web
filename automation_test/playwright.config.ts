import { defineConfig, devices } from '@playwright/test';
import { defineBddProject } from 'playwright-bdd';
import { ENV, RUN } from './config/env';
import { TIMEOUTS } from './config/timeouts';

function hostResolverRules(map: string): string {
  return map
    .split(',')
    .map((rule) => rule.trim())
    .filter(Boolean)
    .map((rule) => (/^MAP\s/i.test(rule) ? rule : `MAP ${rule}`))
    .join(', ');
}

function bdd(name: string, platform: string) {
  return defineBddProject({
    name,
    features: 'bdd/features/**/*.feature',
    featuresRoot: 'bdd/features',
    steps: ['bdd/steps/**/*.ts'],
    outputDir: `.features-gen/${name}`,
    tags: `@${platform}`,
    missingSteps: 'fail-on-gen',
  });
}

export default defineConfig({
  outputDir: './results/test-results',
  snapshotPathTemplate: './bdd/__screenshots__/{projectName}/{testFileName}/{arg}{ext}',
  timeout: TIMEOUTS.test,
  expect: { timeout: TIMEOUTS.expect },
  fullyParallel: RUN.mode === 'parallel',
  workers: RUN.mode === 'serial' ? 1 : RUN.workers ? Number(RUN.workers) : ENV.isCI ? 2 : undefined,
  forbidOnly: ENV.isCI,
  retries: ENV.isCI ? 1 : 0,
  reporter: [
    ['list'],
    ['html', { outputFolder: './results/html-report', open: 'never' }],
    ['junit', { outputFile: './results/junit.xml' }],
    ['json', { outputFile: './results/results.json' }],
    ['monocart-reporter', { name: 'Demoblaze Automation Test Report', outputFile: './results/monocart-report/index.html' }],
  ],
  use: {
    baseURL: ENV.baseUrl,
    headless: !RUN.headed,
    actionTimeout: TIMEOUTS.action,
    navigationTimeout: TIMEOUTS.navigation,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
    testIdAttribute: 'data-testid',
    ignoreHTTPSErrors: true,
  },
  projects: [
    {
      ...bdd('web-chromium', 'web'),
      use: {
        ...devices['Desktop Chrome'],
        launchOptions: ENV.dnsHostMap
          ? { args: [`--host-resolver-rules=${hostResolverRules(ENV.dnsHostMap)}`] }
          : {},
      },
    },
  ],
});
