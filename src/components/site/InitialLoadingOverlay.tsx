import { useEffect, useState } from 'react';

import type { FC } from 'react';
import type { LoadingProps } from 'animal-island-ui';

const loadingStorageKey = 'island-home.initial-loading-seen';
const loadingCompleteEvent = 'island:initial-loading-complete';
const visibleDuration = 1400;
const exitDuration = 650;
type LoadingComponent = FC<LoadingProps>;

declare global {
  interface Window {
    __islandInitialLoadingComplete?: boolean;
  }
}

const announceInitialLoadingComplete = () => {
  window.__islandInitialLoadingComplete = true;
  window.dispatchEvent(new CustomEvent(loadingCompleteEvent));
};

export default function InitialLoadingOverlay() {
  const [isMounted, setIsMounted] = useState(true);
  const [isActive, setIsActive] = useState(true);
  const [LoadingComponent, setLoadingComponent] = useState<LoadingComponent | null>(null);

  useEffect(() => {
    let isCancelled = false;

    try {
      if (window.sessionStorage.getItem(loadingStorageKey) === 'true') {
        window.__islandInitialLoadingComplete = true;
        setIsActive(false);
        setIsMounted(false);
        return () => {
          isCancelled = true;
        };
      }

      window.sessionStorage.setItem(loadingStorageKey, 'true');
    } catch {
      // Storage can be unavailable in private contexts; the loading still degrades safely.
    }

    import('animal-island-ui').then(({ Loading }) => {
      if (!isCancelled) {
        setLoadingComponent(() => Loading);
      }
    });

    const hideTimer = window.setTimeout(() => {
      announceInitialLoadingComplete();
      setIsActive(false);
    }, visibleDuration);

    const removeTimer = window.setTimeout(() => {
      setIsMounted(false);
    }, visibleDuration + exitDuration);

    return () => {
      isCancelled = true;
      window.clearTimeout(hideTimer);
      window.clearTimeout(removeTimer);
    };
  }, []);

  if (!isMounted) {
    return null;
  }

  return (
    <div className="site-initial-loading" aria-hidden={!isActive}>
      {LoadingComponent ? <LoadingComponent active={isActive} /> : null}
    </div>
  );
}
