import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const pageMotionSource = readFileSync(
  new URL('../src/scripts/pageMotion.ts', import.meta.url),
  'utf8',
);
const siteHeaderSource = readFileSync(
  new URL('../src/components/site/SiteHeader.astro', import.meta.url),
  'utf8',
);

test('keeps the site header outside page entrance motion', () => {
  assert.doesNotMatch(pageMotionSource, /gsap\.from\('\.site-header'/);
  assert.doesNotMatch(
    pageMotionSource,
    /gsap\.set\('\.site-header,[^']*'/,
  );
});

test('leaves navigation link interaction motion to the header component', () => {
  assert.doesNotMatch(
    pageMotionSource,
    /liftTargets[\s\S]*?\.site-header__link/,
  );
  assert.match(siteHeaderSource, /\.site-header__link:hover\s*\{/);
  assert.match(siteHeaderSource, /\.site-header__link:active\s*\{/);
  assert.match(siteHeaderSource, /\.site-header__link--active\s*\{/);
});
