import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const homeIslandSource = readFileSync(
  new URL('../src/components/home/HomeIsland.tsx', import.meta.url),
  'utf8',
);
const baseLayoutSource = readFileSync(
  new URL('../src/layouts/BaseLayout.astro', import.meta.url),
  'utf8',
);
const homeIslandStyleSource = readFileSync(
  new URL('../src/components/home/HomeIsland.css', import.meta.url),
  'utf8',
);

test('uses the animal island Cursor once from the shared base layout', () => {
  assert.match(baseLayoutSource, /import \{ Cursor \} from 'animal-island-ui'/);
  assert.match(baseLayoutSource, /<html class="site-cursor-root animal-cursor--force" lang=\{lang\}>/);
  assert.match(baseLayoutSource, /<Cursor className="site-cursor">/);
  assert.doesNotMatch(homeIslandSource, /'Cursor'/);
  assert.doesNotMatch(homeIslandSource, /h\(Cursor/);
});

test('uses the animal island Footer seamless mode for the home sea footer', () => {
  assert.match(
    homeIslandSource,
    /h\(Footer,\s*\{[\s\S]*?key:\s*'footer'[\s\S]*?type:\s*'sea'[\s\S]*?seamless:\s*true[\s\S]*?className:\s*'home-island__footer'[\s\S]*?\}\)/,
  );
  assert.doesNotMatch(homeIslandStyleSource, /background-repeat:\s*repeat-x/);
  assert.doesNotMatch(homeIslandStyleSource, /background-size:\s*auto 100%/);
});
