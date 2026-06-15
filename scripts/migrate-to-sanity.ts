import path from 'node:path';
import { pathToFileURL } from 'node:url';

import { createClient } from '@sanity/client';

import { getDocumentId } from './migration/ids.ts';
import { markdownToPortableText } from './migration/markdown.ts';
import { loadSourceData } from './migration/source-data.ts';

import type { SanityConfig } from '../src/lib/content/config.ts';

type SourceData = Awaited<ReturnType<typeof loadSourceData>>;

export interface MigrationDocument {
  _id: string;
  _type: string;
  [field: string]: unknown;
}

interface MigrationConfig extends SanityConfig {
  token: string;
}

const isHttpUrl = (value?: string) => (
  Boolean(value && /^https?:\/\//.test(value))
);

export function buildMigrationDocuments(
  source: SourceData,
): MigrationDocument[] {
  return [
    ...source.photos.map((photo, index) => ({
      _id: getDocumentId('photo', photo.id),
      _type: 'photo',
      title: photo.title,
      alt: photo.alt,
      location: photo.location,
      shotDate: photo.date,
      camera: photo.camera,
      lens: photo.lens,
      tone: photo.color,
      sortOrder: index,
    })),
    ...source.projects.map((project, index) => ({
      _id: getDocumentId('project', String(index + 1)),
      _type: 'project',
      title: project.title,
      summary: project.summary,
      status: project.status,
      techStack: project.techStack,
      coverTone: project.coverTone,
      sortOrder: index,
      ...(isHttpUrl(project.repoUrl) ? { repoUrl: project.repoUrl } : {}),
      ...(isHttpUrl(project.demoUrl) ? { demoUrl: project.demoUrl } : {}),
    })),
    {
      _id: 'profile',
      _type: 'profile',
      facts: source.profileFacts.map((fact, index) => ({
        _key: getDocumentId('fact', String(index)),
        _type: 'object',
        ...fact,
      })),
      links: source.profileLinks.map((link, index) => ({
        _key: getDocumentId('link', String(index)),
        _type: 'object',
        ...link,
      })),
    },
    ...source.notes.map((note) => ({
      _id: getDocumentId('note', note.slug),
      _type: 'note',
      title: note.data.title,
      slug: {
        _type: 'slug',
        current: note.slug,
      },
      description: note.data.description,
      publishedAt: new Date(note.data.pubDate).toISOString(),
      tags: note.data.tags ?? [],
      body: markdownToPortableText(note.body),
    })),
  ];
}

function resolveMigrationConfig(
  environment: NodeJS.ProcessEnv,
): MigrationConfig {
  const token = environment.SANITY_MIGRATION_TOKEN;
  const projectId = environment.PUBLIC_SANITY_PROJECT_ID;
  const dataset = environment.PUBLIC_SANITY_DATASET;
  const apiVersion = environment.SANITY_API_VERSION;

  if (!token) {
    throw new Error('Missing SANITY_MIGRATION_TOKEN');
  }
  if (!projectId || !dataset || !apiVersion) {
    throw new Error('Missing public Sanity migration configuration');
  }

  return {
    projectId,
    dataset,
    apiVersion,
    token,
  };
}

async function runMigration() {
  const config = resolveMigrationConfig(process.env);
  const client = createClient({
    ...config,
    useCdn: false,
  });
  const source = await loadSourceData();
  const documents = buildMigrationDocuments(source);
  const results = await Promise.allSettled(
    documents.map((document) => client.createOrReplace(document)),
  );
  const failed = results.filter(({ status }) => status === 'rejected');

  console.log(`documents: created/updated ${results.length - failed.length}`);
  console.log(`failed: ${failed.length}`);

  failed.forEach((result) => {
    if (result.status === 'rejected') {
      const message = result.reason instanceof Error
        ? result.reason.message
        : String(result.reason);
      console.error(message);
    }
  });

  if (failed.length > 0) {
    process.exitCode = 1;
  }
}

const entryPath = process.argv[1]
  ? pathToFileURL(path.resolve(process.argv[1])).href
  : '';

if (entryPath === import.meta.url) {
  await runMigration();
}
