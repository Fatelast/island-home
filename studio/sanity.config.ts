import { visionTool } from '@sanity/vision';
import { defineConfig } from 'sanity';
import { structureTool } from 'sanity/structure';

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
    structureTool(),
    visionTool(),
  ],
  schema: {
    types: [],
  },
});
