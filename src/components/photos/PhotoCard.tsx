/** @jsxRuntime classic */
import React, { useState } from 'react';

import { isPanoramaPhoto } from '../../lib/photos';

import type { PhotoItem } from '../../lib/content/types';
import type { PhotoGalleryLabels } from './PhotoGallery';

interface PhotoCardProps {
  photo: PhotoItem;
  labels: PhotoGalleryLabels;
  page: number;
  onOpen: () => void;
  onMeasure: () => void;
}

export default function PhotoCard({
  photo,
  labels,
  page,
  onOpen,
  onMeasure,
}: PhotoCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const hasImage = Boolean(photo.thumbnail) && !imageFailed;

  return (
    <article
      className="photo-card"
      data-page={page}
      data-panorama={isPanoramaPhoto(photo) ? 'true' : undefined}
      data-photo-card
    >
      <button
        className="photo-card__trigger"
        type="button"
        onClick={onOpen}
        aria-label={`${labels.viewOriginal}: ${photo.title}`}
      >
        <span
          className={`photo-card__media photo-card__media--${photo.color}`}
          style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
        >
          <span className="photo-card__visual" data-photo-card-visual>
            {hasImage && (
              <picture>
                {photo.thumbnailSources?.map((source) => (
                  <source
                    key={`${source.src}-${source.width}`}
                    srcSet={`${source.src} ${source.width}w`}
                    type={source.type}
                  />
                ))}
                <img
                  src={photo.thumbnail}
                  alt={photo.alt}
                  loading="lazy"
                  decoding="async"
                  onLoad={onMeasure}
                  onError={() => {
                    setImageFailed(true);
                    onMeasure();
                  }}
                />
              </picture>
            )}
            {!hasImage && (
              <span className="photo-card__placeholder" aria-hidden="true">
                <span>{photo.width} × {photo.height}</span>
              </span>
            )}
          </span>
          <span
            className="photo-card__shine"
            data-photo-card-shine
            aria-hidden="true"
          />
          <span className="photo-card__overlay" data-photo-card-overlay>
            <span className="photo-card__facts">
              <span><small>{labels.location}</small><strong>{photo.location}</strong></span>
              <span><small>{labels.camera}</small><strong>{photo.camera}</strong></span>
              <span><small>{labels.lens}</small><strong>{photo.lens}</strong></span>
            </span>
            <strong className="photo-card__view">{labels.viewOriginal}</strong>
          </span>
        </span>
        <span className="photo-card__summary">
          <strong>{photo.title}</strong>
          <time dateTime={photo.date}>{photo.date}</time>
        </span>
      </button>
    </article>
  );
}
