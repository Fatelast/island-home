export interface SanityEnvironment {
  PUBLIC_SANITY_PROJECT_ID?: string;
  PUBLIC_SANITY_DATASET?: string;
  SANITY_API_VERSION?: string;
}

export interface SanityConfig {
  projectId: string;
  dataset: string;
  apiVersion: string;
}

export function resolveSanityConfig(
  environment: SanityEnvironment,
): SanityConfig {
  const projectId = environment.PUBLIC_SANITY_PROJECT_ID;
  const dataset = environment.PUBLIC_SANITY_DATASET;
  const apiVersion = environment.SANITY_API_VERSION;

  if (!projectId) {
    throw new Error('Missing PUBLIC_SANITY_PROJECT_ID');
  }
  if (!dataset) {
    throw new Error('Missing PUBLIC_SANITY_DATASET');
  }
  if (!apiVersion) {
    throw new Error('Missing SANITY_API_VERSION');
  }

  return {
    projectId,
    dataset,
    apiVersion,
  };
}
