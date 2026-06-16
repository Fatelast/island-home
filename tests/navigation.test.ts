import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isNavigationItemActive,
  normalizePath,
} from '../src/lib/navigation.ts';

test('normalizes paths with trailing slash', () => {
  assert.equal(normalizePath('/island/photos'), '/island/photos/');
  assert.equal(normalizePath('/island/photos/'), '/island/photos/');
});

test('keeps the home navigation item exact', () => {
  assert.equal(isNavigationItemActive('/', '/'), true);
  assert.equal(isNavigationItemActive('/', '/island/photos/'), false);
});

test('marks descendant routes active for island sections', () => {
  assert.equal(isNavigationItemActive('/island/photos/', '/island/photos/2026/'), true);
  assert.equal(isNavigationItemActive('/island/photos/', '/island/photos/2026/05/'), true);
  assert.equal(isNavigationItemActive('/island/notes/', '/island/notes/photo-workflow/'), true);
});

test('does not mark sibling routes active', () => {
  assert.equal(isNavigationItemActive('/island/photos/', '/island/projects/'), false);
  assert.equal(isNavigationItemActive('/island/project/', '/island/projects/'), false);
});
