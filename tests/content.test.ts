import assert from 'node:assert/strict';
import test from 'node:test';

import { resolveSanityConfig } from '../src/lib/content/config.ts';

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
