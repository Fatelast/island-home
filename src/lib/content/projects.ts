import { sanityClient } from './client.ts';
import { mapProjectDocument } from './mappers.ts';
import { PROJECTS_QUERY } from './queries.ts';
import { projects as localProjects } from '../../data/projects.ts';

import type { ProjectDocument } from './mappers.ts';
import type { ProjectItem } from './types.ts';

export async function getProjects(): Promise<ProjectItem[]> {
  if (!sanityClient) {
    return localProjects.map((project, index) => ({
      id: `project-${index + 1}`,
      ...project,
    }));
  }

  const documents = await sanityClient.fetch<ProjectDocument[]>(
    PROJECTS_QUERY,
  );

  return documents.map(mapProjectDocument);
}
