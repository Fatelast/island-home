import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const pageMotionStateKey = '__islandPageMotionReady';

declare global {
  interface Window {
    [pageMotionStateKey]?: boolean;
  }
}

const runPageMotion = () => {
  if (window[pageMotionStateKey]) {
    return;
  }

  window[pageMotionStateKey] = true;

  const mm = gsap.matchMedia();

  mm.add(
    {
      reduceMotion: '(prefers-reduced-motion: reduce)',
      canHover: '(hover: hover) and (pointer: fine)',
    },
    (context) => {
      const { reduceMotion, canHover } = context.conditions ?? {};

      if (reduceMotion) {
        gsap.set('.island-content-page__hero, .island-card', {
          autoAlpha: 1,
          clearProps: 'transform',
        });
        return undefined;
      }

      gsap.from('.island-content-page__hero > *', {
        y: 24,
        autoAlpha: 0,
        duration: 0.62,
        ease: 'power3.out',
        stagger: 0.08,
        clearProps: 'transform',
      });

      ScrollTrigger.batch('.island-card', {
        start: 'top 86%',
        once: true,
        batchMax: 4,
        interval: 0.08,
        onEnter: (batch) => {
          gsap.fromTo(
            batch,
            { y: 28, autoAlpha: 0, scale: 0.985 },
            {
              y: 0,
              autoAlpha: 1,
              scale: 1,
              duration: 0.62,
              ease: 'power3.out',
              stagger: 0.08,
              clearProps: 'transform',
            },
          );
        },
      });

      if (!canHover) {
        return undefined;
      }

      const liftTargets = gsap.utils.toArray<HTMLElement>(
        '.island-action, .island-card--link, .island-card--project',
      );

      const cleanups = liftTargets.map((target) => {
        const enter = () => {
          gsap.to(target, {
            y: -3,
            scale: 1.015,
            duration: 0.22,
            ease: 'power2.out',
            overwrite: 'auto',
          });
        };
        const leave = () => {
          gsap.to(target, {
            y: 0,
            scale: 1,
            duration: 0.28,
            ease: 'power2.out',
            overwrite: 'auto',
            clearProps: 'transform',
          });
        };

        target.addEventListener('pointerenter', enter);
        target.addEventListener('pointerleave', leave);
        target.addEventListener('blur', leave);

        return () => {
          target.removeEventListener('pointerenter', enter);
          target.removeEventListener('pointerleave', leave);
          target.removeEventListener('blur', leave);
        };
      });

      return () => {
        cleanups.forEach((cleanup) => cleanup());
      };
    },
  );
};

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runPageMotion, { once: true });
} else {
  runPageMotion();
}
