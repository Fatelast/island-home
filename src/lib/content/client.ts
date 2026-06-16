import { createClient } from '@sanity/client';

import { resolveOptionalSanityConfig } from './config.ts';

const environment = import.meta.env ?? {};

export const sanityConfig = resolveOptionalSanityConfig({
  PUBLIC_SANITY_PROJECT_ID: environment.PUBLIC_SANITY_PROJECT_ID,
  PUBLIC_SANITY_DATASET: environment.PUBLIC_SANITY_DATASET,
  SANITY_API_VERSION: environment.SANITY_API_VERSION,
});

export const sanityClient = sanityConfig
  ? createClient({
      ...sanityConfig,
      useCdn: false,
      perspective: 'published',
    })
  : null;
