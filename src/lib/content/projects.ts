import { sanityClient } from './client';
import { mapProjectDocument } from './mappers';
import { PROJECTS_QUERY } from './queries';

import type { ProjectDocument } from './mappers';
import type { ProjectItem } from './types';

export async function getProjects(): Promise<ProjectItem[]> {
  const documents = await sanityClient.fetch<ProjectDocument[]>(
    PROJECTS_QUERY,
  );

  return documents.map(mapProjectDocument);
}
