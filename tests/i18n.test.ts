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

test('maps new home dashboard source text to semantic keys', () => {
  assert.equal(getMessageKey('个人小岛控制台'), 'home.dashboard.title');
  assert.equal(t('en', '精选项目'), 'Featured Projects');
});

test('maps island route navigation source text to semantic keys', () => {
  assert.equal(getMessageKey('小岛地图'), 'island.nav.map');
  assert.equal(getMessageKey('开发工坊'), 'island.nav.workshop');
  assert.equal(getMessageKey('海风相册'), 'island.nav.gallery');
  assert.equal(getMessageKey('留言木屋'), 'island.nav.lodge');
  assert.equal(getMessageKey('岛民卡'), 'island.nav.profile');
  assert.equal(t('en', '开发工坊'), 'Workshop');
});

test('maps data-driven island page source text to semantic keys', () => {
  assert.equal(getMessageKey('项目总览'), 'projects.overview');
  assert.equal(getMessageKey('个人主页重构'), 'projects.islandHome.title');
  assert.equal(getMessageKey('摄影索引'), 'photos.index');
  assert.equal(getMessageKey('文章正文暂不纳入国际化范围，页面界面会继续跟随语言切换。'), 'notes.description');
  assert.equal(t('en', '中文文章'), 'Chinese Article');
});

test('maps photo image strategy source text to semantic keys', () => {
  assert.equal(getMessageKey('查看大图'), 'photos.viewOriginal');
  assert.equal(getMessageKey('大图待补充'), 'photos.originalPending');
  assert.equal(t('en', '傍晚海边步道的摄影占位图'), 'Photography placeholder for an evening seaside walk');
});

test('maps photo archive and lightbox interface text to semantic keys', () => {
  assert.equal(getMessageKey('全部照片'), 'photos.archive.all');
  assert.equal(getMessageKey('加载更多'), 'photos.loadMore');
  assert.equal(getMessageKey('上一张'), 'photos.lightbox.previous');
  assert.equal(getMessageKey('下一张'), 'photos.lightbox.next');
  assert.equal(getMessageKey('关闭大图'), 'photos.lightbox.close');
  assert.equal(getMessageKey('图片加载失败'), 'photos.imageError');
});
