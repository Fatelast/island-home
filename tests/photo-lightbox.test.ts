import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const lightboxSource = readFileSync(
  new URL('../src/components/photos/PhotoLightbox.tsx', import.meta.url),
  'utf8',
);

test('keeps page scroll locked while switching photos in the lightbox', () => {
  assert.match(lightboxSource, /const isOpen = Boolean\(photo\);/);
  assert.match(lightboxSource, /document\.documentElement\.style\.overflow = 'hidden';/);
  assert.match(lightboxSource, /}, \[isOpen\]\);/);
  assert.doesNotMatch(
    lightboxSource,
    /document\.documentElement\.style\.overflow = 'hidden';[\s\S]*?}, \[photo\]\);/,
  );
});
