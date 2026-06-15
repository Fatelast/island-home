import { sanityClient } from './client';
import { mapProfileDocument } from './mappers';
import { PROFILE_QUERY } from './queries';

import type { ProfileDocument } from './mappers';
import type { Profile } from './types';

export async function getProfile(): Promise<Profile> {
  const document = await sanityClient.fetch<ProfileDocument | null>(
    PROFILE_QUERY,
  );

  return mapProfileDocument(document);
}
