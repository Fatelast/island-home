import type { PhotoItem } from './content/types.ts';

export const PHOTO_PAGE_SIZE = 30;
export const PANORAMA_RATIO = 2.4;

export interface PhotoArchive {
  year?: number;
  month?: number;
}

export interface PhotoArchivePage {
  archive: PhotoArchive;
  page: number;
  totalPages: number;
  photos: PhotoItem[];
  href: string;
  dataHref: string;
  nextHref?: string;
  nextDataHref?: string;
}

export function sortPhotosByDate(items: readonly PhotoItem[]): PhotoItem[] {
  return [...items].sort((left, right) => right.date.localeCompare(left.date));
}

export function getPhotoArchive(
  items: readonly PhotoItem[],
  archive: PhotoArchive,
): PhotoItem[] {
  return sortPhotosByDate(items).filter((photo) => {
    const [year, month] = photo.date.split('-').map(Number);
    return (!archive.year || year === archive.year)
      && (!archive.month || month === archive.month);
  });
}

export function isPanoramaPhoto(photo: Pick<PhotoItem, 'width' | 'height'>): boolean {
  return photo.width / photo.height >= PANORAMA_RATIO;
}

export function getPhotoArchiveBaseHref(archive: PhotoArchive): string {
  if (archive.year && archive.month) {
    return `/island/photos/${archive.year}/${String(archive.month).padStart(2, '0')}/`;
  }
  if (archive.year) {
    return `/island/photos/${archive.year}/`;
  }
  return '/island/photos/';
}

export function getPhotoArchivePageHref(archive: PhotoArchive, page: number): string {
  const baseHref = getPhotoArchiveBaseHref(archive);
  return page === 1 ? baseHref : `${baseHref}page/${page}/`;
}

export function getPhotoArchiveDataHref(archive: PhotoArchive, page: number): string {
  const path = getPhotoArchivePageHref(archive, page)
    .replace('/island/photos/', '')
    .replace(/\/$/, '');
  return `/island/photos/data/${path || 'all'}.json`;
}

export function buildPhotoArchivePages(
  items: readonly PhotoItem[],
  pageSize = PHOTO_PAGE_SIZE,
  archive: PhotoArchive = {},
): PhotoArchivePage[] {
  const filtered = getPhotoArchive(items, archive);
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));

  return Array.from({ length: totalPages }, (_, index) => {
    const page = index + 1;
    const nextPage = page < totalPages ? page + 1 : undefined;

    return {
      archive,
      page,
      totalPages,
      photos: filtered.slice(index * pageSize, page * pageSize),
      href: getPhotoArchivePageHref(archive, page),
      dataHref: getPhotoArchiveDataHref(archive, page),
      ...(nextPage
        ? {
            nextHref: getPhotoArchivePageHref(archive, nextPage),
            nextDataHref: getPhotoArchiveDataHref(archive, nextPage),
          }
        : {}),
    };
  });
}

export function getPhotoArchiveOptions(items: readonly PhotoItem[]) {
  const years = new Map<number, Set<number>>();

  sortPhotosByDate(items).forEach(({ date }) => {
    const [year, month] = date.split('-').map(Number);
    const months = years.get(year) ?? new Set<number>();
    months.add(month);
    years.set(year, months);
  });

  return [...years.entries()]
    .sort(([left], [right]) => right - left)
    .map(([year, months]) => ({
      year,
      months: [...months].sort((left, right) => right - left),
    }));
}

export function buildAllPhotoArchivePages(
  items: readonly PhotoItem[],
  pageSize = PHOTO_PAGE_SIZE,
): PhotoArchivePage[] {
  const archives: PhotoArchive[] = [
    {},
    ...getPhotoArchiveOptions(items).flatMap(({ year, months }) => [
      { year },
      ...months.map((month) => ({ year, month })),
    ]),
  ];

  return archives.flatMap((archive) => buildPhotoArchivePages(items, pageSize, archive));
}

export function parsePhotoArchivePath(path: string) {
  const parts = path.split('/').filter(Boolean);
  const pageIndex = parts.indexOf('page');
  const page = pageIndex >= 0 ? Number(parts[pageIndex + 1]) : 1;
  const archiveParts = pageIndex >= 0 ? parts.slice(0, pageIndex) : parts;

  if (
    !Number.isInteger(page)
    || page < 1
    || archiveParts.length > 2
    || (pageIndex >= 0 && pageIndex !== parts.length - 2)
  ) {
    return undefined;
  }

  const year = archiveParts[0] ? Number(archiveParts[0]) : undefined;
  const month = archiveParts[1] ? Number(archiveParts[1]) : undefined;

  if (
    (year !== undefined && (!Number.isInteger(year) || year < 1))
    || (month !== undefined && (!Number.isInteger(month) || month < 1 || month > 12))
  ) {
    return undefined;
  }

  return {
    archive: {
      ...(year ? { year } : {}),
      ...(month ? { month } : {}),
    },
    page,
  };
}

export function mergeUniquePhotos(
  existing: readonly PhotoItem[],
  incoming: readonly PhotoItem[],
): PhotoItem[] {
  const seen = new Set(existing.map(({ id }) => id));
  return [
    ...existing,
    ...incoming.filter(({ id }) => {
      if (seen.has(id)) {
        return false;
      }
      seen.add(id);
      return true;
    }),
  ];
}

export function getAdjacentPhotoIndex(
  current: number,
  direction: -1 | 1,
  length: number,
): number | undefined {
  const next = current + direction;
  return next >= 0 && next < length ? next : undefined;
}
