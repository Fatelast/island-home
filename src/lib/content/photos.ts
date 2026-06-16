import { sanityClient, sanityConfig } from './client.ts';
import { createPhotoImageUrls } from './image.ts';
import { mapPhotoDocument } from './mappers.ts';
import { PHOTO_QUERY } from './queries.ts';
import { photos as localPhotos } from '../../data/photos.ts';

import type { PhotoDocument } from './mappers.ts';
import type { PhotoItem } from './types.ts';

interface PhotoDimensions {
  width: number;
  height: number;
}

const localPhotoDimensions = new Map<string, PhotoDimensions>(
  localPhotos.map(({ id, width, height }) => [id, { width, height }]),
);

function getSourcePhotoId(documentId: string): string {
  return documentId.replace(/^photo-/, '');
}

export function getPhotoFallbackDimensions(
  documentId: string,
): PhotoDimensions | undefined {
  return localPhotoDimensions.get(getSourcePhotoId(documentId));
}

function hasSanityDimensions(document: PhotoDocument): boolean {
  return Boolean(document.dimensions?.width && document.dimensions.height);
}

export async function getPhotos(): Promise<PhotoItem[]> {
  if (!sanityClient || !sanityConfig) {
    return localPhotos;
  }

  const documents = await sanityClient.fetch<PhotoDocument[]>(PHOTO_QUERY);

  return documents.map((document) => {
    const urls = document.image
      ? createPhotoImageUrls(sanityConfig, document.image)
      : {};
    const photo = mapPhotoDocument(document, urls);
    const fallbackDimensions = hasSanityDimensions(document)
      ? undefined
      : getPhotoFallbackDimensions(document._id);

    return fallbackDimensions
      ? { ...photo, ...fallbackDimensions }
      : photo;
  });
}
