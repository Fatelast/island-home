import { sanityClient } from './client.ts';
import { mapNoteDocument } from './mappers.ts';
import { markdownToPortableText } from '../../../scripts/migration/markdown.ts';
import {
  NOTES_QUERY,
  NOTE_BY_SLUG_QUERY,
} from './queries.ts';

import type { NoteDocument } from './mappers.ts';
import type {
  NoteDetail,
  NoteSummary,
} from './types.ts';

interface LocalNoteEntry {
  id: string;
  slug?: string;
  body?: string;
  data: {
    title: string;
    description: string;
    pubDate: Date;
    tags: string[];
  };
}

const getLocalNoteSlug = (entry: LocalNoteEntry) => (
  entry.slug ?? entry.id.replace(/\.(md|mdx)$/i, '')
);

async function getLocalNotes() {
  const { getCollection } = await import('astro:content');
  return getCollection('notes') as Promise<LocalNoteEntry[]>;
}

export async function getNotes(): Promise<NoteSummary[]> {
  if (!sanityClient) {
    const notes = await getLocalNotes();

    return notes
      .map((note) => ({
        id: note.id,
        slug: getLocalNoteSlug(note),
        title: note.data.title,
        description: note.data.description,
        publishedAt: note.data.pubDate.toISOString(),
        tags: note.data.tags,
      }))
      .sort((left, right) => right.publishedAt.localeCompare(left.publishedAt));
  }

  const documents = await sanityClient.fetch<NoteDocument[]>(NOTES_QUERY);

  return documents.map((document) => {
    const { body: _body, ...summary } = mapNoteDocument(document);
    return summary;
  });
}

export async function getNoteBySlug(
  slug: string,
): Promise<NoteDetail> {
  if (!sanityClient) {
    const notes = await getLocalNotes();
    const note = notes.find((entry) => getLocalNoteSlug(entry) === slug);

    if (!note) {
      throw new Error(`Missing local note for slug: ${slug}`);
    }

    return {
      id: note.id,
      slug: getLocalNoteSlug(note),
      title: note.data.title,
      description: note.data.description,
      publishedAt: note.data.pubDate.toISOString(),
      tags: note.data.tags,
      body: markdownToPortableText(note.body ?? ''),
    };
  }

  const document = await sanityClient.fetch<NoteDocument | null>(
    NOTE_BY_SLUG_QUERY,
    { slug },
  );

  if (!document) {
    throw new Error(`Missing published note for slug: ${slug}`);
  }

  return mapNoteDocument(document);
}
