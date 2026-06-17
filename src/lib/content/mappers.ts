import type {
  NoteDetail,
  PhotoItem,
  PortableTextContent,
  Profile,
  ProjectItem,
} from './types.ts';

export interface PhotoDocument {
  _id: string;
  title: string;
  alt: string;
  location?: string;
  shotDate: string;
  camera?: string;
  lens?: string;
  tone?: PhotoItem['color'];
  image?: unknown;
  dimensions?: {
    width?: number;
    height?: number;
  };
}

export interface PhotoUrls {
  thumbnail?: string;
  original?: string;
}

export function mapPhotoDocument(
  document: PhotoDocument,
  urls: PhotoUrls = {},
): PhotoItem {
  return {
    id: document._id,
    title: document.title,
    alt: document.alt,
    location: document.location ?? '',
    date: document.shotDate,
    camera: document.camera ?? '',
    lens: document.lens ?? '',
    width: document.dimensions?.width ?? 1600,
    height: document.dimensions?.height ?? 1067,
    thumbnail: urls.thumbnail,
    original: urls.original,
    color: document.tone ?? 'teal',
  };
}

export interface ProjectDocument {
  _id: string;
  title: string;
  summary: string;
  status: string;
  techStack?: string[];
  repoUrl?: string;
  demoUrl?: string;
  coverImage?: string;
  coverTone: ProjectItem['coverTone'];
}

export function mapProjectDocument(
  document: ProjectDocument,
): ProjectItem {
  return {
    id: document._id,
    title: document.title,
    summary: document.summary,
    status: document.status,
    techStack: document.techStack ?? [],
    repoUrl: document.repoUrl || undefined,
    demoUrl: document.demoUrl || undefined,
    coverImage: document.coverImage || undefined,
    coverTone: document.coverTone,
  };
}

export interface ProfileDocument {
  facts?: Profile['facts'];
  links?: Profile['links'];
}

export function mapProfileDocument(
  document: ProfileDocument | null,
): Profile {
  if (!document) {
    throw new Error('Missing profile singleton document');
  }

  return {
    facts: document.facts ?? [],
    links: document.links ?? [],
  };
}

export interface NoteDocument {
  _id: string;
  title: string;
  slug?: string;
  description: string;
  publishedAt: string;
  tags?: string[];
  bodyMarkdown?: string;
  body?: PortableTextContent;
}

export function mapNoteDocument(
  document: NoteDocument,
): NoteDetail {
  if (!document.slug) {
    throw new Error(`Missing slug for note ${document._id}`);
  }

  return {
    id: document._id,
    slug: document.slug,
    title: document.title,
    description: document.description,
    publishedAt: document.publishedAt,
    tags: document.tags ?? [],
    body: document.body ?? [],
  };
}
