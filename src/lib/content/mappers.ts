import type { PhotoItem } from './types';

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
