import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const homeIslandSource = readFileSync(
  new URL('../src/components/home/HomeIsland.tsx', import.meta.url),
  'utf8',
);
const homeIslandStyleSource = readFileSync(
  new URL('../src/components/home/HomeIsland.css', import.meta.url),
  'utf8',
);

test('uses the animal island Footer seamless mode for the home sea footer', () => {
  assert.match(
    homeIslandSource,
    /h\(Footer,\s*\{\s*key:\s*'footer',\s*type:\s*'sea',\s*seamless:\s*true,\s*className:\s*'home-island__footer'\s*\}\)/,
  );
  assert.doesNotMatch(homeIslandStyleSource, /background-repeat:\s*repeat-x/);
  assert.doesNotMatch(homeIslandStyleSource, /background-size:\s*auto 100%/);
});
