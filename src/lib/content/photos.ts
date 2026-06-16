import { sanityClient, sanityConfig } from './client.ts';
import { createPhotoImageUrls } from './image.ts';
import { mapPhotoDocument } from './mappers.ts';
import { PHOTO_QUERY } from './queries.ts';
import { photos as localPhotos } from '../../data/photos.ts';

import type { PhotoDocument } from './mappers.ts';
import type { PhotoItem } from './types.ts';

export async function getPhotos(): Promise<PhotoItem[]> {
  if (!sanityClient || !sanityConfig) {
    return localPhotos;
  }

  const documents = await sanityClient.fetch<PhotoDocument[]>(PHOTO_QUERY);

  return documents.map((document) => {
    const urls = document.image
      ? createPhotoImageUrls(sanityConfig, document.image)
      : {};

    return mapPhotoDocument(document, urls);
  });
}
