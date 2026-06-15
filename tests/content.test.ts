import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSanityConfig } from '../src/lib/content/config.ts';
import { mapPhotoDocument } from '../src/lib/content/mappers.ts';

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
