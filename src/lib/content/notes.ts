import { sanityClient } from './client';
import { mapNoteDocument } from './mappers';
import {
  NOTES_QUERY,
  NOTE_BY_SLUG_QUERY,
} from './queries';

import type { NoteDocument } from './mappers';
import type {
  NoteDetail,
  NoteSummary,
} from './types';

export async function getNotes(): Promise<NoteSummary[]> {
  const documents = await sanityClient.fetch<NoteDocument[]>(NOTES_QUERY);

  return documents.map((document) => {
    const { body: _body, ...summary } = mapNoteDocument(document);
    return summary;
  });
}

export async function getNoteBySlug(
  slug: string,
): Promise<NoteDetail> {
  const document = await sanityClient.fetch<NoteDocument | null>(
    NOTE_BY_SLUG_QUERY,
    { slug },
  );

  if (!document) {
    throw new Error(`Missing published note for slug: ${slug}`);
  }

  return mapNoteDocument(document);
}
