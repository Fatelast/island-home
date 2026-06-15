import assert from 'node:assert/strict';
import test from 'node:test';

import { getDocumentId } from '../scripts/migration/ids.ts';
import { markdownToPortableText } from '../scripts/migration/markdown.ts';
import { loadSourceData } from '../scripts/migration/source-data.ts';
import { buildMigrationDocuments } from '../scripts/migrate-to-sanity.ts';

test('creates stable Sanity document ids', () => {
  assert.equal(
    getDocumentId('photo', 'evening-sea-breeze'),
    'photo-evening-sea-breeze',
  );
  assert.equal(
    getDocumentId('note', 'photo workflow'),
    'note-photo-workflow',
  );
});

test('converts headings, paragraphs, links, and lists', () => {
  const blocks = markdownToPortableText(`
## 标题

正文包含[链接](https://example.com)。

- 第一项
- 第二项
  `);

  assert.equal(blocks[0].style, 'h2');
  assert.equal(blocks[1].style, 'normal');
  assert.equal(blocks[1].markDefs[0].href, 'https://example.com');
  assert.equal(blocks[2].listItem, 'bullet');
  assert.equal(blocks[3].listItem, 'bullet');
});

test('loads the existing local content without frontmatter in note bodies', async () => {
  const source = await loadSourceData();

  assert.equal(source.photos.length, 4);
  assert.equal(source.projects.length, 3);
  assert.equal(source.notes.length, 2);
  assert.equal(source.notes.some((note) => note.body.includes('---')), false);
});

test('builds idempotent documents and omits relative URL fields', () => {
  const documents = buildMigrationDocuments({
    photos: [{
      id: 'evening-sea-breeze',
      title: '傍晚的海风',
      alt: '海边照片',
      location: '海边',
      date: '2026-05-18',
      camera: '',
      lens: '',
      width: 6000,
      height: 4000,
      color: 'teal',
    }],
    projects: [{
      title: '个人主页',
      summary: '项目简介',
      status: '进行中',
      techStack: ['Astro'],
      repoUrl: 'https://example.com/repository',
      demoUrl: '/',
      coverTone: 'mint',
    }],
    profileFacts: [{ label: '身份', value: '前端开发者' }],
    profileLinks: [{ label: '主页', href: 'https://example.com' }],
    notes: [{
      slug: 'hello-world',
      data: {
        title: '你好',
        description: '文章摘要',
        pubDate: '2026-06-05',
        tags: ['记录'],
      },
      body: '正文内容。',
    }],
  });

  assert.equal(documents[0]._id, 'photo-evening-sea-breeze');
  assert.equal(documents[1]._id, 'project-1');
  assert.equal('demoUrl' in documents[1], false);
  assert.equal(documents[2]._id, 'profile');
  assert.equal(documents[3]._id, 'note-hello-world');
  assert.equal(documents[3].publishedAt, '2026-06-05T00:00:00.000Z');
});
