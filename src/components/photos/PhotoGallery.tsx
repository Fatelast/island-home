/** @jsxRuntime classic */
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import PhotoCard from './PhotoCard';
import PhotoLightbox from './PhotoLightbox';
import { mergeUniquePhotos } from '../../lib/photos';

import type { PhotoItem } from '../../data/photos';
import type { PhotoArchivePage } from '../../lib/photos';

import './PhotoGallery.css';

gsap.registerPlugin(useGSAP);

export interface PhotoGalleryLabels {
  location: string;
  date: string;
  camera: string;
  lens: string;
  loadMore: string;
  end: string;
  viewOriginal: string;
  imageLoading: string;
  imageError: string;
  retry: string;
  previous: string;
  next: string;
  close: string;
  details: string;
  currentPhoto: string;
}

export interface PhotoGalleryProps {
  initialPhotos: PhotoItem[];
  page: number;
  totalPages: number;
  nextHref?: string;
  nextDataHref?: string;
  labels: PhotoGalleryLabels;
}

interface PhotoBatch {
  page: number;
  photos: PhotoItem[];
}

export default function PhotoGallery({
  initialPhotos,
  page,
  totalPages,
  nextHref,
  nextDataHref,
  labels,
}: PhotoGalleryProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const animationFrameRef = useRef<number>();
  const [enhanced, setEnhanced] = useState(false);
  const [batches, setBatches] = useState<PhotoBatch[]>([
    { page, photos: initialPhotos },
  ]);
  const [nextPageHref, setNextPageHref] = useState(nextHref);
  const [nextPageDataHref, setNextPageDataHref] = useState(nextDataHref);
  const [isLoading, setIsLoading] = useState(false);
  const [loadError, setLoadError] = useState(false);
  const [activePhotoId, setActivePhotoId] = useState<string | null>(null);
  const photos = useMemo(
    () => batches.flatMap(({ photos: batchPhotos }) => batchPhotos),
    [batches],
  );

  const measureCards = useCallback(() => {
    const grid = gridRef.current;
    if (!grid) {
      return;
    }
    const styles = getComputedStyle(grid);
    const rowHeight = Number.parseFloat(styles.gridAutoRows);
    const rowGap = Number.parseFloat(styles.rowGap);
    if (!rowHeight || Number.isNaN(rowGap)) {
      return;
    }
    grid.querySelectorAll<HTMLElement>('[data-photo-card]').forEach((card) => {
      const span = Math.ceil(
        (card.getBoundingClientRect().height + rowGap) / (rowHeight + rowGap),
      );
      card.style.gridRowEnd = `span ${span}`;
    });
  }, []);

  useEffect(() => {
    setEnhanced(true);
    const observer = new ResizeObserver(() => measureCards());
    if (gridRef.current) {
      observer.observe(gridRef.current);
    }
    animationFrameRef.current = requestAnimationFrame(measureCards);
    return () => {
      observer.disconnect();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [measureCards]);

  useEffect(() => {
    animationFrameRef.current = requestAnimationFrame(measureCards);
  }, [batches, measureCards]);

  useEffect(() => {
    const handlePopState = () => {
      const currentBatch = batches.find(({ page: batchPage }) => (
        window.location.pathname.endsWith(`/page/${batchPage}/`)
        || (batchPage === 1 && !window.location.pathname.includes('/page/'))
      ));
      if (currentBatch) {
        document.querySelector(`[data-photo-batch="${currentBatch.page}"]`)
          ?.scrollIntoView({ block: 'start' });
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [batches]);

  useGSAP(() => {
    const media = gsap.matchMedia();
    media.add(
      { reduceMotion: '(prefers-reduced-motion: reduce)' },
      ({ conditions }) => {
        if (conditions?.reduceMotion) {
          gsap.set('[data-photo-card]', { autoAlpha: 1, clearProps: 'transform' });
          return undefined;
        }
        gsap.from('[data-photo-card]', {
          y: 22,
          autoAlpha: 0,
          duration: 0.52,
          stagger: 0.05,
          ease: 'power3.out',
          clearProps: 'transform',
        });
        return undefined;
      },
    );
    return () => media.revert();
  }, { scope: scopeRef });

  const loadNextPage = useCallback(async (): Promise<PhotoItem[]> => {
    if (!nextPageDataHref || isLoading) {
      return [];
    }
    setIsLoading(true);
    setLoadError(false);
    try {
      const response = await fetch(nextPageDataHref);
      if (!response.ok) {
        throw new Error(`Photo page request failed: ${response.status}`);
      }
      const payload = await response.json() as PhotoArchivePage;
      const merged = mergeUniquePhotos(photos, payload.photos);
      const added = merged.slice(photos.length);
      setBatches((current) => {
        return added.length > 0
          ? [...current, { page: payload.page, photos: added }]
          : current;
      });
      setNextPageHref(payload.nextHref);
      setNextPageDataHref(payload.nextDataHref);
      window.history.pushState({ photoPage: payload.page }, '', payload.href);

      requestAnimationFrame(() => {
        measureCards();
        if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
          gsap.from(`[data-photo-batch="${payload.page}"] [data-photo-card]`, {
            y: 20,
            autoAlpha: 0,
            duration: 0.48,
            stagger: 0.04,
            ease: 'power3.out',
            clearProps: 'transform',
          });
        }
      });
      return added;
    } catch {
      setLoadError(true);
      return [];
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, measureCards, nextPageDataHref, photos]);

  return (
    <div
      ref={scopeRef}
      className={`photo-gallery${enhanced ? ' photo-gallery--enhanced' : ''}`}
    >
      <div ref={gridRef} className="photo-gallery__grid" aria-live="polite">
        {batches.map((batch) => (
          <React.Fragment key={batch.page}>
            <span
              className="photo-gallery__batch-anchor"
              data-photo-batch={batch.page}
              aria-hidden="true"
            />
            {batch.photos.map((photo) => (
              <PhotoCard
                key={photo.id}
                photo={photo}
                labels={labels}
                page={batch.page}
                onOpen={() => setActivePhotoId(photo.id)}
                onMeasure={measureCards}
              />
            ))}
          </React.Fragment>
        ))}
      </div>

      <div className="photo-gallery__pagination">
        {nextPageHref ? (
          <a
            className="photo-gallery__load-more"
            href={nextPageHref}
            aria-disabled={isLoading}
            onClick={(event) => {
              if (!nextPageDataHref) {
                return;
              }
              event.preventDefault();
              void loadNextPage();
            }}
          >
            {isLoading ? labels.imageLoading : loadError ? labels.retry : labels.loadMore}
          </a>
        ) : (
          <span className="photo-gallery__end">{labels.end}</span>
        )}
      </div>

      <PhotoLightbox
        photos={photos}
        currentPhotoId={activePhotoId}
        labels={labels}
        hasNextPage={Boolean(nextPageDataHref)}
        onClose={() => setActivePhotoId(null)}
        onChange={setActivePhotoId}
        onRequestNextPage={loadNextPage}
      />
    </div>
  );
}
