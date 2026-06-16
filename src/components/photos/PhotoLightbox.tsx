/** @jsxRuntime classic */
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { getAdjacentPhotoIndex } from '../../lib/photos';

import type { PhotoItem } from '../../lib/content/types';
import type { PhotoGalleryLabels } from './PhotoGallery';

interface PhotoLightboxProps {
  photos: PhotoItem[];
  currentPhotoId: string | null;
  labels: PhotoGalleryLabels;
  hasNextPage: boolean;
  onClose: () => void;
  onChange: (photoId: string) => void;
  onRequestNextPage: () => Promise<PhotoItem[]>;
}

export default function PhotoLightbox({
  photos,
  currentPhotoId,
  labels,
  hasNextPage,
  onClose,
  onChange,
  onRequestNextPage,
}: PhotoLightboxProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const returnFocusRef = useRef<HTMLElement | null>(null);
  const [imageState, setImageState] = useState<'loading' | 'ready' | 'error'>('loading');
  const currentIndex = currentPhotoId
    ? photos.findIndex(({ id }) => id === currentPhotoId)
    : -1;
  const photo = currentIndex >= 0 ? photos[currentIndex] : undefined;
  const previousIndex = getAdjacentPhotoIndex(currentIndex, -1, photos.length);
  const nextIndex = getAdjacentPhotoIndex(currentIndex, 1, photos.length);
  const source = photo?.original || photo?.thumbnail;
  const isOpen = Boolean(photo);
  const canGoNext = nextIndex !== undefined || hasNextPage;

  const adjacentSources = useMemo(() => (
    [previousIndex, nextIndex]
      .filter((index): index is number => index !== undefined)
      .map((index) => photos[index].original || photos[index].thumbnail)
      .filter((item): item is string => Boolean(item))
  ), [nextIndex, photos, previousIndex]);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) {
      return undefined;
    }

    if (photo && !dialog.open) {
      returnFocusRef.current = document.activeElement as HTMLElement | null;
      dialog.showModal();
    }

    if (!photo && dialog.open) {
      dialog.close();
    }

    return undefined;
  }, [photo]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const previousOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.documentElement.style.overflow = previousOverflow;
    };
  }, [isOpen]);

  useEffect(() => {
    setImageState(source ? 'loading' : 'ready');
  }, [source]);

  useEffect(() => {
    if (imageState !== 'ready') {
      return;
    }
    adjacentSources.forEach((item) => {
      const image = new Image();
      image.src = item;
    });
  }, [adjacentSources, imageState]);

  const close = () => {
    onClose();
    dialogRef.current?.close();
    requestAnimationFrame(() => returnFocusRef.current?.focus());
  };

  const goPrevious = () => {
    if (previousIndex !== undefined) {
      onChange(photos[previousIndex].id);
    }
  };

  const goNext = async () => {
    if (nextIndex !== undefined) {
      onChange(photos[nextIndex].id);
      return;
    }
    if (hasNextPage) {
      const incoming = await onRequestNextPage();
      if (incoming[0]) {
        onChange(incoming[0].id);
      }
    }
  };

  useEffect(() => {
    if (!photo) {
      return undefined;
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        close();
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        goPrevious();
      } else if (event.key === 'ArrowRight') {
        event.preventDefault();
        void goNext();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  });

  return (
    <dialog
      ref={dialogRef}
      className="photo-lightbox"
      aria-labelledby="photo-lightbox-title"
      aria-describedby="photo-lightbox-details"
      onCancel={(event) => {
        event.preventDefault();
        close();
      }}
      onClose={() => {
        if (currentPhotoId) {
          onClose();
        }
      }}
    >
      {photo && (
        <div className="photo-lightbox__layout">
          <div className="photo-lightbox__toolbar">
            <span>{currentIndex + 1} / {photos.length}</span>
            <button type="button" onClick={close} aria-label={labels.close} title={labels.close}>
              ×
            </button>
          </div>
          <div
            className={`photo-lightbox__stage photo-card__media--${photo.color}`}
            style={{ '--photo-ratio': `${photo.width} / ${photo.height}` } as React.CSSProperties}
          >
            {source && (
              <img
                key={source}
                className="photo-lightbox__image"
                src={source}
                alt={photo.alt}
                onLoad={() => setImageState('ready')}
                onError={() => setImageState('error')}
              />
            )}
            {imageState === 'loading' && (
              <span className="photo-lightbox__state">{labels.imageLoading}</span>
            )}
            {!source && (
              <span className="photo-lightbox__state">
                {photo.width} × {photo.height}
              </span>
            )}
            {source && imageState === 'error' && (
              <span className="photo-lightbox__state">{labels.imageError}</span>
            )}
            <button
              className="photo-lightbox__nav photo-lightbox__nav--previous"
              type="button"
              onClick={goPrevious}
              disabled={previousIndex === undefined}
              aria-label={labels.previous}
              title={labels.previous}
            >
              ‹
            </button>
            <button
              className="photo-lightbox__nav photo-lightbox__nav--next"
              type="button"
              onClick={() => void goNext()}
              disabled={!canGoNext}
              aria-label={labels.next}
              title={labels.next}
            >
              ›
            </button>
          </div>
          <section className="photo-lightbox__details" id="photo-lightbox-details">
            <div>
              <span>{labels.details}</span>
              <h2 id="photo-lightbox-title">{photo.title}</h2>
            </div>
            <dl>
              <div><dt>{labels.date}</dt><dd>{photo.date}</dd></div>
              <div><dt>{labels.location}</dt><dd>{photo.location}</dd></div>
              <div><dt>{labels.camera}</dt><dd>{photo.camera}</dd></div>
              <div><dt>{labels.lens}</dt><dd>{photo.lens}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </dialog>
  );
}
