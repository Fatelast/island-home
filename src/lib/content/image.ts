import imageUrlBuilder from '@sanity/image-url';

import type { SanityConfig } from './config.ts';

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

export function createContentImageUrl(
  configuration: SanityConfig,
  source: unknown,
  width = 1600,
) {
  return imageUrlBuilder(configuration)
    .image(source)
    .width(width)
    .fit('max')
    .auto('format')
    .url();
}
