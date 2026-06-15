import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import {
  buildAllPhotoArchivePages,
  buildPhotoArchivePages,
  getAdjacentPhotoIndex,
  getPhotoArchive,
  isPanoramaPhoto,
  mergeUniquePhotos,
  parsePhotoArchivePath,
  sortPhotosByDate,
} from '../src/lib/photos.ts';
import { getPhotoCardMotion } from '../src/lib/photo-card-motion.ts';

import type { PhotoItem } from '../src/data/photos.ts';

const makePhoto = (
  id: string,
  date: string,
  width = 6000,
  height = 4000,
): PhotoItem => ({
  id,
  title: id,
  alt: id,
  location: '测试地点',
  date,
  camera: '测试相机',
  lens: '测试镜头',
  width,
  height,
  thumbnail: '',
  original: '',
  color: 'teal',
});

test('sorts photos by shooting date descending without mutating input', () => {
  const input = [
    makePhoto('old', '2025-02-01'),
    makePhoto('new', '2026-05-01'),
  ];

  const result = sortPhotosByDate(input);

  assert.deepEqual(result.map(({ id }) => id), ['new', 'old']);
  assert.deepEqual(input.map(({ id }) => id), ['old', 'new']);
});

test('filters a year and month archive', () => {
  const input = [
    makePhoto('may', '2026-05-18'),
    makePhoto('april', '2026-04-08'),
    makePhoto('previous-year', '2025-05-01'),
  ];

  assert.deepEqual(
    getPhotoArchive(input, { year: 2026, month: 5 }).map(({ id }) => id),
    ['may'],
  );
});

test('builds stable 30-item static pages', () => {
  const input = Array.from(
    { length: 61 },
    (_, index) => makePhoto(
      `photo-${index}`,
      `2026-05-${String((index % 28) + 1).padStart(2, '0')}`,
    ),
  );

  const pages = buildPhotoArchivePages(input, 30);

  assert.equal(pages.length, 3);
  assert.equal(pages[0].photos.length, 30);
  assert.equal(pages[2].photos.length, 1);
  assert.equal(pages[1].page, 2);
  assert.equal(pages[1].totalPages, 3);
});

test('treats ratios at or above 2.4 as panoramas', () => {
  assert.equal(isPanoramaPhoto(makePhoto('wide', '2026-05-01', 12000, 5000)), true);
  assert.equal(isPanoramaPhoto(makePhoto('regular', '2026-05-01', 6000, 4000)), false);
});

test('builds all, year, and month archive pages', () => {
  const input = [
    makePhoto('may', '2026-05-18'),
    makePhoto('april', '2026-04-08'),
    makePhoto('previous-year', '2025-05-01'),
  ];

  const pages = buildAllPhotoArchivePages(input, 30);
  const hrefs = pages.map(({ href }) => href);

  assert.ok(hrefs.includes('/island/photos/'));
  assert.ok(hrefs.includes('/island/photos/2026/'));
  assert.ok(hrefs.includes('/island/photos/2026/05/'));
  assert.ok(hrefs.includes('/island/photos/2025/05/'));
});

test('parses archive paths and rejects unsupported shapes', () => {
  assert.deepEqual(parsePhotoArchivePath('2026/05/page/2'), {
    archive: { year: 2026, month: 5 },
    page: 2,
  });
  assert.equal(parsePhotoArchivePath('2026/13'), undefined);
  assert.equal(parsePhotoArchivePath('unexpected/path/value'), undefined);
});

test('merges loaded pages without duplicate photo ids', () => {
  const existing = [makePhoto('one', '2026-05-18')];
  const incoming = [
    makePhoto('one', '2026-05-18'),
    makePhoto('two', '2026-05-17'),
  ];

  assert.deepEqual(
    mergeUniquePhotos(existing, incoming).map(({ id }) => id),
    ['one', 'two'],
  );
});

test('calculates bounded lightbox indexes', () => {
  assert.equal(getAdjacentPhotoIndex(0, -1, 4), undefined);
  assert.equal(getAdjacentPhotoIndex(0, 1, 4), 1);
  assert.equal(getAdjacentPhotoIndex(3, 1, 4), undefined);
  assert.equal(getAdjacentPhotoIndex(3, -1, 4), 2);
});

test('loads shared island page styles from every photo archive route', () => {
  const sharedPage = readFileSync(
    new URL('../src/components/photos/PhotoArchivePage.astro', import.meta.url),
    'utf8',
  );
  const rootPage = readFileSync(
    new URL('../src/pages/island/photos/index.astro', import.meta.url),
    'utf8',
  );

  assert.match(sharedPage, /import '\.\.\/\.\.\/styles\/island-pages\.css';/);
  assert.doesNotMatch(rootPage, /styles\/island-pages\.css/);
});

test('keeps pointer-driven photo card motion centered and bounded', () => {
  assert.deepEqual(
    getPhotoCardMotion({
      pointerX: 150,
      pointerY: 100,
      width: 300,
      height: 200,
    }),
    {
      rotationX: 0,
      rotationY: 0,
      shineX: 0,
      shineY: 0,
    },
  );

  const edge = getPhotoCardMotion({
    pointerX: 900,
    pointerY: -200,
    width: 300,
    height: 200,
  });

  assert.equal(edge.rotationX, 3);
  assert.equal(edge.rotationY, 3);
  assert.equal(edge.shineX, 18);
  assert.equal(edge.shineY, -18);
});
