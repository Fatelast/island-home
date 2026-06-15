import imageUrlBuilder from '@sanity/image-url';

import type { SanityConfig } from './config';

export function createPhotoImageUrls(
  configuration: SanityConfig,
  source: unknown,
) {
  const builder = imageUrlBuilder(configuration);

  return {
    thumbnail: builder
      .image(source)
      .width(1200)
      .fit('max')
      .auto('format')
      .url(),
    original: builder
      .image(source)
      .width(2400)
      .fit('max')
      .auto('format')
      .url(),
  };
}
