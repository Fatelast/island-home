import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

import { schemaTypes } from './schemaTypes';
import { structure } from './structure';

const projectId = process.env.SANITY_STUDIO_PROJECT_ID;
const dataset = process.env.SANITY_STUDIO_DATASET;

if (!projectId) {
  throw new Error('Missing SANITY_STUDIO_PROJECT_ID');
}

if (!dataset) {
  throw new Error('Missing SANITY_STUDIO_DATASET');
}

export default defineConfig({
  name: 'island-home',
  title: 'Island Home',
  projectId,
  dataset,
  plugins: [
    structureTool({ structure }),
    visionTool(),
  ],
  schema: {
    types: schemaTypes,
  },
  document: {
    actions: (previous, context) => {
      if (context.schemaType !== 'profile') {
        return previous;
      }

      return previous.filter(({ action }) => (
        action !== 'delete' && action !== 'duplicate'
      ));
    },
    newDocumentOptions: (previous) => previous.filter(
      ({ templateId }) => templateId !== 'profile',
    ),
  },
});
