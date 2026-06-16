import { sanityClient } from './client.ts';
import { mapProfileDocument } from './mappers.ts';
import { PROFILE_QUERY } from './queries.ts';
import { profileFacts, profileLinks } from '../../data/profile.ts';

import type { ProfileDocument } from './mappers.ts';
import type { Profile } from './types.ts';

export async function getProfile(): Promise<Profile> {
  if (!sanityClient) {
    return {
      facts: profileFacts,
      links: profileLinks,
    };
  }

  const document = await sanityClient.fetch<ProfileDocument | null>(
    PROFILE_QUERY,
  );

  return mapProfileDocument(document);
}
