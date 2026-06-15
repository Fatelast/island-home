import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

import matter from 'gray-matter';

import { photos } from '../../src/data/photos.ts';
import { profileFacts, profileLinks } from '../../src/data/profile.ts';
import { projects } from '../../src/data/projects.ts';

export interface NoteFrontmatter {
  title: string;
  description: string;
  pubDate: string | Date;
  tags?: string[];
  locale?: string;
}

export async function loadSourceData() {
  const notesDirectory = path.resolve('src/content/notes');
  const files = (await readdir(notesDirectory))
    .filter((file) => file.endsWith('.md') || file.endsWith('.mdx'))
    .sort();
  const notes = await Promise.all(files.map(async (file) => {
    const source = await readFile(path.join(notesDirectory, file), 'utf8');
    const parsed = matter(source);

    return {
      slug: path.basename(file, path.extname(file)),
      data: parsed.data as NoteFrontmatter,
      body: parsed.content,
    };
  }));

  return {
    photos,
    projects,
    profileFacts,
    profileLinks,
    notes,
  };
}
