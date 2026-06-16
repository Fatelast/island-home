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
const islandPagesStyleSource = readFileSync(
  new URL('../src/styles/island-pages.css', import.meta.url),
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

test('keeps shared island page titles stable during page entrance motion', () => {
  assert.doesNotMatch(pageMotionSource, /island-content-page__hero/);
});

test('uses a compact shared island page title treatment', () => {
  assert.doesNotMatch(islandPagesStyleSource, /font-size:\s*clamp\(42px,\s*8vw,\s*82px\)/);
  assert.doesNotMatch(islandPagesStyleSource, /grid-template-columns:[^;]*max-content/);
  assert.match(islandPagesStyleSource, /flex-direction:\s*column/);
  assert.doesNotMatch(islandPagesStyleSource, /grid-template-areas/);
  assert.match(islandPagesStyleSource, /font-size:\s*clamp\(30px,\s*4\.2vw,\s*48px\)/);
});
