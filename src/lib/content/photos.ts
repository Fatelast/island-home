import { sanityClient, sanityConfig } from './client';
import { createPhotoImageUrls } from './image';
import { mapPhotoDocument } from './mappers';
import { PHOTO_QUERY } from './queries';

import type { PhotoDocument } from './mappers';
import type { PhotoItem } from './types';

export async function getPhotos(): Promise<PhotoItem[]> {
  const documents = await sanityClient.fetch<PhotoDocument[]>(PHOTO_QUERY);

  return documents.map((document) => {
    const urls = document.image
      ? createPhotoImageUrls(sanityConfig, document.image)
      : {};

    return mapPhotoDocument(document, urls);
  });
}
