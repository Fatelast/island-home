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
import { getPhotoCardMotion } from '../../lib/photo-card-motion';
import { mergeUniquePhotos } from '../../lib/photos';

import type { PhotoItem } from '../../lib/content/types';
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
  const loadingRef = useRef(false);
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

  useGSAP((_, contextSafe) => {
    const grid = gridRef.current;
    if (!grid) {
      return undefined;
    }

    let activeCard: HTMLElement | null = null;
    let activeMotion: {
      card: HTMLElement;
      rotationX: ReturnType<typeof gsap.quickTo>;
      rotationY: ReturnType<typeof gsap.quickTo>;
      shineX?: ReturnType<typeof gsap.quickTo>;
      shineY?: ReturnType<typeof gsap.quickTo>;
    } | null = null;

    const getCard = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return null;
      }
      const card = target.closest<HTMLElement>('[data-photo-card]');
      return card && grid.contains(card) ? card : null;
    };

    const getPart = (card: HTMLElement, selector: string) => (
      card.querySelector<HTMLElement>(selector)
    );

    const animateCard = (card: HTMLElement, isActive: boolean) => {
      const visual = getPart(card, '[data-photo-card-visual]');
      const overlay = getPart(card, '[data-photo-card-overlay]');
      const shine = getPart(card, '[data-photo-card-shine]');

      gsap.to(card, {
        y: isActive ? -6 : 0,
        scale: isActive ? 1.01 : 1,
        boxShadow: isActive
          ? '0 16px 0 rgba(114, 93, 66, 0.11)'
          : '0 8px 0 rgba(114, 93, 66, 0.08)',
        duration: isActive ? 0.24 : 0.34,
        ease: isActive ? 'power2.out' : 'power3.out',
        overwrite: 'auto',
      });
      if (visual) {
        gsap.to(visual, {
          scale: isActive ? 1.035 : 1,
          duration: isActive ? 0.46 : 0.38,
          ease: 'power3.out',
          overwrite: 'auto',
        });
      }
      if (overlay) {
        gsap.to(overlay, {
          y: isActive ? 0 : 10,
          autoAlpha: isActive ? 1 : 0,
          duration: isActive ? 0.22 : 0.18,
          ease: 'power2.out',
          overwrite: 'auto',
        });
      }
      if (shine) {
        gsap.to(shine, {
          autoAlpha: isActive ? 0.58 : 0,
          duration: 0.2,
          ease: 'power1.out',
          overwrite: 'auto',
        });
      }
    };

    const resetActiveCard = () => {
      if (!activeCard) {
        return;
      }
      activeMotion?.rotationX(0);
      activeMotion?.rotationY(0);
      activeMotion?.shineX?.(0);
      activeMotion?.shineY?.(0);
      animateCard(activeCard, false);
      activeCard = null;
      activeMotion = null;
    };

    const activateCard = (card: HTMLElement) => {
      if (activeCard === card) {
        return;
      }
      resetActiveCard();
      activeCard = card;
      gsap.set(card, {
        transformPerspective: 900,
        transformOrigin: '50% 50%',
      });
      animateCard(card, true);
    };

    const getMotion = (card: HTMLElement) => {
      if (activeMotion?.card === card) {
        return activeMotion;
      }
      const shine = getPart(card, '[data-photo-card-shine]');
      activeMotion = {
        card,
        rotationX: gsap.quickTo(card, 'rotationX', {
          duration: 0.32,
          ease: 'power3.out',
        }),
        rotationY: gsap.quickTo(card, 'rotationY', {
          duration: 0.32,
          ease: 'power3.out',
        }),
        ...(shine ? {
          shineX: gsap.quickTo(shine, 'xPercent', {
            duration: 0.4,
            ease: 'power3.out',
          }),
          shineY: gsap.quickTo(shine, 'yPercent', {
            duration: 0.4,
            ease: 'power3.out',
          }),
        } : {}),
      };
      return activeMotion;
    };

    const handlePointerOver = contextSafe((event: PointerEvent) => {
      const card = getCard(event.target);
      if (
        !card
        || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))
      ) {
        return;
      }
      activateCard(card);
    });

    const handlePointerMove = contextSafe((event: PointerEvent) => {
      const card = getCard(event.target);
      if (!card) {
        return;
      }
      activateCard(card);
      const bounds = card.getBoundingClientRect();
      const motion = getPhotoCardMotion({
        pointerX: event.clientX - bounds.left,
        pointerY: event.clientY - bounds.top,
        width: bounds.width,
        height: bounds.height,
      });
      const controller = getMotion(card);
      controller.rotationX(motion.rotationX);
      controller.rotationY(motion.rotationY);
      controller.shineX?.(motion.shineX);
      controller.shineY?.(motion.shineY);
    });

    const handlePointerOut = contextSafe((event: PointerEvent) => {
      const card = getCard(event.target);
      if (
        !card
        || (event.relatedTarget instanceof Node && card.contains(event.relatedTarget))
      ) {
        return;
      }
      resetActiveCard();
    });

    const handleFocusIn = contextSafe((event: FocusEvent) => {
      const card = getCard(event.target);
      if (card) {
        activateCard(card);
      }
    });

    const handleFocusOut = contextSafe((event: FocusEvent) => {
      const card = getCard(event.target);
      if (
        card
        && !(event.relatedTarget instanceof Node && card.contains(event.relatedTarget))
      ) {
        resetActiveCard();
      }
    });

    const handlePointerDown = contextSafe((event: PointerEvent) => {
      const card = getCard(event.target);
      if (!card) {
        return;
      }
      gsap.to(card, {
        y: activeCard === card ? -3 : 1,
        scale: 0.985,
        duration: 0.12,
        ease: 'power2.out',
        overwrite: 'auto',
      });
    });

    const handlePointerUp = contextSafe((event: PointerEvent) => {
      const card = getCard(event.target);
      if (!card) {
        return;
      }
      animateCard(card, activeCard === card);
    });

    const handlePointerCancel = contextSafe(() => {
      resetActiveCard();
    });

    const media = gsap.matchMedia();
    media.add(
      {
        finePointer: '(hover: hover) and (pointer: fine)',
        reduceMotion: '(prefers-reduced-motion: reduce)',
      },
      ({ conditions }) => {
        if (conditions?.reduceMotion) {
          return undefined;
        }

        grid.addEventListener('focusin', handleFocusIn);
        grid.addEventListener('focusout', handleFocusOut);
        grid.addEventListener('pointerdown', handlePointerDown);
        grid.addEventListener('pointerup', handlePointerUp);
        grid.addEventListener('pointercancel', handlePointerCancel);

        if (conditions?.finePointer) {
          grid.addEventListener('pointerover', handlePointerOver);
          grid.addEventListener('pointermove', handlePointerMove);
          grid.addEventListener('pointerout', handlePointerOut);
        }

        return () => {
          grid.removeEventListener('focusin', handleFocusIn);
          grid.removeEventListener('focusout', handleFocusOut);
          grid.removeEventListener('pointerdown', handlePointerDown);
          grid.removeEventListener('pointerup', handlePointerUp);
          grid.removeEventListener('pointercancel', handlePointerCancel);
          grid.removeEventListener('pointerover', handlePointerOver);
          grid.removeEventListener('pointermove', handlePointerMove);
          grid.removeEventListener('pointerout', handlePointerOut);
          activeCard = null;
          activeMotion = null;
        };
      },
    );

    return () => media.revert();
  }, { scope: scopeRef });

  const loadNextPage = useCallback(async (): Promise<PhotoItem[]> => {
    if (!nextPageDataHref || loadingRef.current) {
      return [];
    }
    loadingRef.current = true;
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
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [measureCards, nextPageDataHref, photos]);

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
