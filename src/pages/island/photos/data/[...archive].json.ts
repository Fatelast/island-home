import { getPhotos } from '../../../../lib/content/photos.ts';
import { buildAllPhotoArchivePages } from '../../../../lib/photos.ts';

import type { APIRoute } from 'astro';

export async function getStaticPaths() {
  const photos = await getPhotos();

  return buildAllPhotoArchivePages(photos).map((pageData) => ({
    params: {
      archive: pageData.dataHref
        .replace('/island/photos/data/', '')
        .replace(/\.json$/, ''),
    },
    props: { pageData },
  }));
}

export const GET: APIRoute = ({ props }) => new Response(
  JSON.stringify(props.pageData),
  {
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'public, max-age=3600',
    },
  },
);
