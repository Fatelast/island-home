import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

import { resolveSanityConfig } from '../src/lib/content/config.ts';
import {
  getPhotoFallbackDimensions,
  getPhotos,
} from '../src/lib/content/photos.ts';
import { getProfile } from '../src/lib/content/profile.ts';
import { getProjects } from '../src/lib/content/projects.ts';
import {
  mapNoteDocument,
  mapPhotoDocument,
  mapProfileDocument,
  mapProjectDocument,
} from '../src/lib/content/mappers.ts';

test('rejects incomplete Sanity configuration', () => {
  assert.throws(
    () => resolveSanityConfig({}),
    /PUBLIC_SANITY_PROJECT_ID/,
  );
});

test('builds public read configuration without a token', () => {
  assert.deepEqual(resolveSanityConfig({
    PUBLIC_SANITY_PROJECT_ID: 'abc123xy',
    PUBLIC_SANITY_DATASET: 'production',
    SANITY_API_VERSION: '2026-06-15',
  }), {
    projectId: 'abc123xy',
    dataset: 'production',
    apiVersion: '2026-06-15',
  });
});

test('falls back to local content when Sanity environment is not configured', async () => {
  const [photos, projects, profile] = await Promise.all([
    getPhotos(),
    getProjects(),
    getProfile(),
  ]);

  assert.equal(photos.length, 4);
  assert.equal(projects.length, 3);
  assert.equal(profile.facts.length > 0, true);
  assert.equal(profile.links.length > 0, true);
});

test('maps a Sanity photo to the existing gallery contract', () => {
  const result = mapPhotoDocument({
    _id: 'photo-evening',
    title: '傍晚的海风',
    alt: '海边日落',
    location: '海边步道',
    shotDate: '2026-05-18',
    camera: 'Sony A7C II',
    lens: '35mm F1.8',
    tone: 'teal',
    image: {
      asset: { _ref: 'image-example-6000x4000-jpg' },
    },
    dimensions: {
      width: 6000,
      height: 4000,
    },
  }, {
    thumbnail: 'https://cdn.sanity.io/photo.jpg?w=1200',
    original: 'https://cdn.sanity.io/photo.jpg?w=2400',
  });

  assert.deepEqual(result, {
    id: 'photo-evening',
    title: '傍晚的海风',
    alt: '海边日落',
    location: '海边步道',
    date: '2026-05-18',
    camera: 'Sony A7C II',
    lens: '35mm F1.8',
    width: 6000,
    height: 4000,
    thumbnail: 'https://cdn.sanity.io/photo.jpg?w=1200',
    original: 'https://cdn.sanity.io/photo.jpg?w=2400',
    color: 'teal',
  });
});

test('maps a photo without optional metadata to a safe placeholder', () => {
  const result = mapPhotoDocument({
    _id: 'photo-placeholder',
    title: '占位照片',
    alt: '尚未上传图片',
    shotDate: '2026-06-15',
  });

  assert.equal(result.location, '');
  assert.equal(result.camera, '');
  assert.equal(result.lens, '');
  assert.equal(result.width, 1600);
  assert.equal(result.height, 1067);
  assert.equal(result.thumbnail, undefined);
  assert.equal(result.original, undefined);
  assert.equal(result.color, 'teal');
});

test('uses legacy dimensions for migrated Sanity photo placeholders', () => {
  assert.deepEqual(getPhotoFallbackDimensions('photo-sunny-street-corner'), {
    width: 4000,
    height: 6000,
  });
  assert.equal(getPhotoFallbackDimensions('photo-unknown'), undefined);
});

test('maps optional project links to undefined', () => {
  const result = mapProjectDocument({
    _id: 'project-one',
    title: '项目',
    summary: '简介',
    status: '进行中',
    techStack: ['Astro'],
    coverTone: 'mint',
  });

  assert.deepEqual(result, {
    id: 'project-one',
    title: '项目',
    summary: '简介',
    status: '进行中',
    techStack: ['Astro'],
    repoUrl: undefined,
    demoUrl: undefined,
    coverImage: undefined,
    coverTone: 'mint',
  });
});

test('maps profile arrays and rejects a missing singleton', () => {
  assert.deepEqual(mapProfileDocument({
    facts: [{ label: '身份', value: '前端开发者' }],
  }), {
    facts: [{ label: '身份', value: '前端开发者' }],
    links: [],
  });

  assert.throws(
    () => mapProfileDocument(null),
    /profile singleton/i,
  );
});

test('project and profile pages read through the Sanity content layer', () => {
  const projectPage = readFileSync(
    new URL('../src/pages/island/projects/index.astro', import.meta.url),
    'utf8',
  );
  const profilePage = readFileSync(
    new URL('../src/pages/island/about/index.astro', import.meta.url),
    'utf8',
  );

  assert.match(projectPage, /getProjects/);
  assert.doesNotMatch(projectPage, /data\/projects/);
  assert.match(profilePage, /getProfile/);
  assert.doesNotMatch(profilePage, /data\/profile/);
});

test('maps a published note and rejects missing slugs', () => {
  const source = {
    _id: 'note-one',
    title: '第一篇文章',
    slug: 'first-note',
    description: '摘要',
    publishedAt: '2026-06-05T00:00:00.000Z',
    tags: ['生活'],
    body: [],
  };
  const note = mapNoteDocument(source);

  assert.equal(note.slug, 'first-note');
  assert.deepEqual(note.tags, ['生活']);
  assert.throws(
    () => mapNoteDocument({ ...source, slug: '' }),
    /slug/,
  );
});

test('note pages read through the Sanity content layer', () => {
  const listPage = readFileSync(
    new URL('../src/pages/island/notes/index.astro', import.meta.url),
    'utf8',
  );
  const detailPage = readFileSync(
    new URL('../src/pages/island/notes/[slug].astro', import.meta.url),
    'utf8',
  );

  assert.match(listPage, /getNotes/);
  assert.doesNotMatch(listPage, /getCollection/);
  assert.match(detailPage, /getNoteBySlug/);
  assert.doesNotMatch(detailPage, /getCollection|render\(note\)/);
});
