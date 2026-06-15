import type { PortableTextBlock } from '@portabletext/types';

export interface PhotoSource {
  src: string;
  width: number;
  type?: 'image/avif' | 'image/webp';
}

export interface PhotoItem {
  id: string;
  title: string;
  alt: string;
  location: string;
  date: string;
  camera: string;
  lens: string;
  width: number;
  height: number;
  thumbnail?: string;
  thumbnailSources?: PhotoSource[];
  original?: string;
  color: 'teal' | 'gold' | 'pink' | 'green';
}

export interface NoteSummary {
  id: string;
  slug: string;
  title: string;
  description: string;
  publishedAt: string;
  tags: string[];
}

export interface NoteDetail extends NoteSummary {
  body: PortableTextBlock[];
}

export interface ProjectItem {
  id: string;
  title: string;
  summary: string;
  status: string;
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
  coverImage?: string;
  coverTone: 'mint' | 'sunset' | 'sky';
}

export interface ProfileFact {
  label: string;
  value: string;
}

export interface ProfileLink {
  label: string;
  href: string;
}

export interface Profile {
  facts: ProfileFact[];
  links: ProfileLink[];
}
