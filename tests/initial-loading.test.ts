import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const indexPageSource = readFileSync(
  new URL('../src/pages/index.astro', import.meta.url),
  'utf8',
);
const layoutSource = readFileSync(
  new URL('../src/layouts/BaseLayout.astro', import.meta.url),
  'utf8',
);
const initialLoadingSource = readFileSync(
  new URL('../src/components/site/InitialLoadingOverlay.tsx', import.meta.url),
  'utf8',
);
const homeIslandSource = readFileSync(
  new URL('../src/components/home/HomeIsland.tsx', import.meta.url),
  'utf8',
);

test('enables the animal island loading overlay only from the home page', () => {
  assert.match(indexPageSource, /showInitialLoading/);
  assert.match(layoutSource, /showInitialLoading = false/);
  assert.match(layoutSource, /<InitialLoadingOverlay client:load \/>/);
});

test('stores initial loading state in session storage', () => {
  assert.match(initialLoadingSource, /Loading/);
  assert.match(initialLoadingSource, /window\.sessionStorage/);
  assert.match(initialLoadingSource, /visibleDuration = 1400/);
});

test('coordinates the home entrance motion with initial loading completion', () => {
  assert.match(initialLoadingSource, /island:initial-loading-complete/);
  assert.match(initialLoadingSource, /dispatchEvent\(new CustomEvent\(loadingCompleteEvent\)\)/);
  assert.match(homeIslandSource, /window\.addEventListener\(loadingCompleteEvent/);
  assert.match(homeIslandSource, /paused: shouldWaitForInitialLoading/);
  assert.match(homeIslandSource, /hasPlayedIntro/);
});
