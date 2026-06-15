import { createClient } from '@sanity/client';

import { resolveSanityConfig } from './config';

export const sanityConfig = resolveSanityConfig({
  PUBLIC_SANITY_PROJECT_ID: import.meta.env.PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET: import.meta.env.PUBLIC_SANITY_DATASET,
  SANITY_API_VERSION: import.meta.env.SANITY_API_VERSION,
});

export const sanityClient = createClient({
  ...sanityConfig,
  useCdn: false,
  perspective: 'published',
});
