import assert from 'node:assert/strict';
import test from 'node:test';

import {
  defaultLocale,
  getMessageKey,
  isLocale,
  t,
} from '../src/i18n/index.ts';

test('translates Chinese source text through a stable semantic key', () => {
  assert.equal(t('en', '首页'), 'Home');
  assert.equal(t('zh-CN', '首页'), '首页');
});

test('falls back to source text when a source mapping does not exist', () => {
  assert.equal(t('en', '不存在的文案'), '不存在的文案');
});

test('falls back to default locale when a locale is unsupported', () => {
  assert.equal(t('ja', '项目作品'), '项目作品');
  assert.equal(defaultLocale, 'zh-CN');
});

test('checks supported locales', () => {
  assert.equal(isLocale('zh-CN'), true);
  assert.equal(isLocale('en'), true);
  assert.equal(isLocale('ja'), false);
});

test('uses constant-time source text lookup for semantic keys', () => {
  assert.equal(getMessageKey('摄影作品'), 'nav.photos');
  assert.equal(getMessageKey('不存在的文案'), undefined);
});
