import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import {
  createElement as h,
  useEffect,
  useRef,
  useState,
} from 'react';

import { t } from '../../i18n';

import './HomeIsland.css';

gsap.registerPlugin(useGSAP);

const loadingCompleteEvent = 'island:initial-loading-complete';

declare global {
  interface Window {
    __islandInitialLoadingComplete?: boolean;
  }
}

interface HomeIslandProps {
  locale: string;
}

type AnimalIslandUi = typeof import('animal-island-ui');
type AnimalComponents = Pick<
  AnimalIslandUi,
  | 'Card'
  | 'Cursor'
  | 'Divider'
  | 'Footer'
  | 'Icon'
  | 'Phone'
  | 'Time'
  | 'Typewriter'
>;

const featureCards = [
  {
    title: '开发工坊',
    description: '前端作品、GitHub 仓库和线上预览会先在这里汇合。',
    href: '/island/projects/',
    icon: 'icon-design',
    color: 'app-yellow',
  },
  {
    title: '海风相册',
    description: '为相机照片预留缩略图、大图预览和拍摄元信息。',
    href: '/island/photos/',
    icon: 'icon-camera',
    color: 'app-teal',
  },
  {
    title: '留言木屋',
    description: '用 Markdown / MDX 慢慢整理日常照片、文字和文章。',
    href: '/island/notes/',
    icon: 'icon-chat',
    color: 'app-pink',
  },
] as const;

const statusItems = [
  {
    label: '当前阶段',
    value: '静态 MVP',
  },
  {
    label: '内容来源',
    value: '静态数据 / MDX',
  },
  {
    label: '图片策略',
    value: '缩略图优先',
  },
] as const;

export default function HomeIsland({ locale }: HomeIslandProps) {
  const scopeRef = useRef<HTMLDivElement>(null);
  const [animalComponents, setAnimalComponents] = useState<AnimalComponents | null>(
    null,
  );
  const hasAnimalComponents = Boolean(animalComponents);

  useEffect(() => {
    let isCancelled = false;

    void import('animal-island-ui')
      .then((components) => {
        if (isCancelled) {
          return;
        }

        setAnimalComponents({
          Card: components.Card,
          Cursor: components.Cursor,
          Divider: components.Divider,
          Footer: components.Footer,
          Icon: components.Icon,
          Phone: components.Phone,
          Time: components.Time,
          Typewriter: components.Typewriter,
        });
      })
      .catch(() => {
        if (!isCancelled) {
          setAnimalComponents(null);
        }
      });

    return () => {
      isCancelled = true;
    };
  }, []);

  useGSAP((_context, contextSafe) => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        reduceMotion: '(prefers-reduced-motion: reduce)',
        isDesktop: '(min-width: 921px)',
        canHover: '(hover: hover) and (pointer: fine)',
      },
      (mediaContext) => {
        const { reduceMotion, isDesktop, canHover } = mediaContext.conditions ?? {};
        const root = scopeRef.current;

        if (!root) {
          return undefined;
        }

        if (reduceMotion) {
          gsap.set(
            [
              '.home-island__topbar',
              '.home-island__title-card',
              '.home-island__dialogue',
              '.home-island__actions',
              '.home-island__phone-panel',
              '.home-island__divider',
              '.home-island__feature-link',
              '.home-island__status-card',
            ].join(', '),
            { autoAlpha: 1, clearProps: 'transform' },
          );
          return undefined;
        }

        const shouldWaitForInitialLoading = (
          document.documentElement.dataset.initialLoadingSeen !== 'true'
          && !window.__islandInitialLoadingComplete
        );

        const introTimeline = gsap.timeline({
          paused: shouldWaitForInitialLoading,
          defaults: { ease: 'power3.out', duration: 0.72 },
        });

        introTimeline
          .fromTo(
            '.home-island__topbar',
            { y: 34, scale: 0.98, autoAlpha: 0 },
            { y: 0, scale: 1, autoAlpha: 1, clearProps: 'transform' },
          )
          .fromTo(
            '.home-island__title-card',
            { y: 70, scale: 0.92, autoAlpha: 0 },
            { y: 0, scale: 1, autoAlpha: 1, ease: 'back.out(1.45)', clearProps: 'transform' },
            '-=0.28',
          )
          .fromTo(
            '.home-island__dialogue',
            { y: 48, scale: 0.96, autoAlpha: 0 },
            { y: 0, scale: 1, autoAlpha: 1, clearProps: 'transform' },
            '-=0.46',
          )
          .fromTo(
            '.home-island__actions > a',
            { y: 32, scale: 0.9, autoAlpha: 0 },
            {
              y: 0,
              scale: 1,
              autoAlpha: 1,
              ease: 'back.out(1.8)',
              stagger: 0.08,
              clearProps: 'transform',
            },
            '-=0.38',
          )
          .fromTo(
            '.home-island__phone-panel',
            {
              x: isDesktop ? 38 : 0,
              y: 58,
              scale: 0.94,
              rotation: 2.4,
              autoAlpha: 0,
            },
            {
              x: 0,
              y: 0,
              scale: 1,
              rotation: 0,
              autoAlpha: 1,
              ease: 'back.out(1.3)',
              clearProps: 'transform',
            },
            '-=0.58',
          )
          .fromTo(
            '.home-island__divider',
            { y: 22, scaleX: 0.68, autoAlpha: 0 },
            { y: 0, scaleX: 1, autoAlpha: 1, clearProps: 'transform' },
            '-=0.2',
          )
          .fromTo(
            '.home-island__feature-link',
            { y: 54, scale: 0.92, autoAlpha: 0 },
            {
              y: 0,
              scale: 1,
              autoAlpha: 1,
              ease: 'back.out(1.45)',
              stagger: 0.08,
              clearProps: 'transform',
            },
            '-=0.16',
          )
          .fromTo(
            '.home-island__status-card',
            { y: 34, scale: 0.95, autoAlpha: 0 },
            { y: 0, scale: 1, autoAlpha: 1, stagger: 0.06, clearProps: 'transform' },
            '-=0.42',
          );

        let hasPlayedIntro = false;
        let loadingFallbackTimer: number | undefined;
        const playIntroAfterLoading = contextSafe(() => {
          if (hasPlayedIntro) {
            return;
          }

          hasPlayedIntro = true;
          if (loadingFallbackTimer) {
            window.clearTimeout(loadingFallbackTimer);
            loadingFallbackTimer = undefined;
          }
          introTimeline.play(0);
        });

        if (shouldWaitForInitialLoading) {
          window.addEventListener(loadingCompleteEvent, playIntroAfterLoading, { once: true });
          loadingFallbackTimer = window.setTimeout(playIntroAfterLoading, 2400);
        }

        gsap.to('.home-island__phone', {
          y: -10,
          rotation: '+=1.2',
          duration: 3.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        const cleanups: Array<() => void> = [];
        const addListener = <K extends keyof HTMLElementEventMap>(
          target: HTMLElement,
          type: K,
          listener: (event: HTMLElementEventMap[K]) => void,
        ) => {
          target.addEventListener(type, listener as EventListener);
          cleanups.push(() => target.removeEventListener(type, listener as EventListener));
        };

        const actionLinks = gsap.utils.toArray<HTMLElement>(
          '.home-island__primary-link, .home-island__secondary-link',
          root,
        );
        const featureLinks = gsap.utils.toArray<HTMLElement>('.home-island__feature-link', root);

        actionLinks.forEach((link) => {
          const icon = link.firstElementChild as HTMLElement | null;
          const press = contextSafe(() => {
            gsap.to(link, {
              scale: 0.96,
              duration: 0.1,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          });
          const release = contextSafe(() => {
            gsap.to(link, {
              scale: canHover ? 1.035 : 1,
              duration: 0.22,
              ease: 'back.out(2)',
              overwrite: 'auto',
            });
          });

          addListener(link, 'pointerdown', press);
          addListener(link, 'pointerup', release);
          addListener(link, 'pointercancel', release);

          if (!canHover) {
            return;
          }

          const moveX = gsap.quickTo(link, 'x', { duration: 0.34, ease: 'power3.out' });
          const moveY = gsap.quickTo(link, 'y', { duration: 0.34, ease: 'power3.out' });
          const rotate = gsap.quickTo(link, 'rotation', { duration: 0.34, ease: 'power3.out' });
          const enter = contextSafe(() => {
            gsap.to(link, {
              scale: 1.035,
              duration: 0.24,
              ease: 'back.out(2)',
              overwrite: 'auto',
            });
            if (icon) {
              gsap.to(icon, {
                y: -2,
                rotation: -5,
                scale: 1.08,
                duration: 0.28,
                ease: 'back.out(2.4)',
                overwrite: 'auto',
              });
            }
          });
          const move = contextSafe((event: PointerEvent) => {
            const bounds = link.getBoundingClientRect();
            const normalizedX = ((event.clientX - bounds.left) / bounds.width) - 0.5;
            const normalizedY = ((event.clientY - bounds.top) / bounds.height) - 0.5;

            moveX(normalizedX * 12);
            moveY((normalizedY * 7) - 3);
            rotate(normalizedX * 2);
          });
          const leave = contextSafe(() => {
            moveX(0);
            moveY(0);
            rotate(0);
            gsap.to(link, {
              scale: 1,
              duration: 0.28,
              ease: 'power3.out',
              overwrite: 'auto',
            });
            if (icon) {
              gsap.to(icon, {
                y: 0,
                rotation: 0,
                scale: 1,
                duration: 0.28,
                ease: 'power3.out',
                overwrite: 'auto',
              });
            }
          });

          addListener(link, 'pointerenter', enter);
          addListener(link, 'pointermove', move);
          addListener(link, 'pointerleave', leave);
          addListener(link, 'focus', enter);
          addListener(link, 'blur', leave);
        });

        featureLinks.forEach((link) => {
          const card = link.querySelector<HTMLElement>('.home-island__feature-card');
          const icon = link.querySelector<HTMLElement>('.home-island__feature-icon');
          const shine = link.querySelector<HTMLElement>('.home-island__feature-shine');

          if (!card) {
            return;
          }

          const press = contextSafe(() => {
            gsap.to(card, {
              y: canHover ? -2 : 1,
              scale: 0.985,
              duration: 0.1,
              ease: 'power2.out',
              overwrite: 'auto',
            });
          });
          const release = contextSafe(() => {
            gsap.to(card, {
              y: canHover ? -8 : 0,
              scale: canHover ? 1.02 : 1,
              duration: 0.24,
              ease: 'back.out(1.8)',
              overwrite: 'auto',
            });
          });

          addListener(link, 'pointerdown', press);
          addListener(link, 'pointerup', release);
          addListener(link, 'pointercancel', release);

          if (!canHover) {
            return;
          }

          gsap.set(card, { transformPerspective: 900, transformOrigin: 'center center' });
          const rotateX = gsap.quickTo(card, 'rotationX', { duration: 0.38, ease: 'power3.out' });
          const rotateY = gsap.quickTo(card, 'rotationY', { duration: 0.38, ease: 'power3.out' });
          const enter = contextSafe(() => {
            gsap.to(card, {
              y: -8,
              scale: 1.02,
              duration: 0.3,
              ease: 'back.out(1.8)',
              overwrite: 'auto',
            });
            if (icon) {
              gsap.to(icon, {
                y: -5,
                rotation: -4,
                scale: 1.08,
                duration: 0.32,
                ease: 'back.out(2.2)',
                overwrite: 'auto',
              });
            }
            if (shine) {
              gsap.fromTo(
                shine,
                { xPercent: -140, autoAlpha: 0 },
                {
                  xPercent: 150,
                  autoAlpha: 0.72,
                  duration: 0.68,
                  ease: 'power2.out',
                  overwrite: true,
                },
              );
            }
          });
          const move = contextSafe((event: PointerEvent) => {
            const bounds = link.getBoundingClientRect();
            const normalizedX = ((event.clientX - bounds.left) / bounds.width) - 0.5;
            const normalizedY = ((event.clientY - bounds.top) / bounds.height) - 0.5;

            rotateX(normalizedY * -7);
            rotateY(normalizedX * 9);
          });
          const leave = contextSafe(() => {
            rotateX(0);
            rotateY(0);
            gsap.to(card, {
              y: 0,
              scale: 1,
              duration: 0.38,
              ease: 'power3.out',
              overwrite: 'auto',
            });
            if (icon) {
              gsap.to(icon, {
                y: 0,
                rotation: 0,
                scale: 1,
                duration: 0.32,
                ease: 'power3.out',
                overwrite: 'auto',
              });
            }
          });

          addListener(link, 'pointerenter', enter);
          addListener(link, 'pointermove', move);
          addListener(link, 'pointerleave', leave);
          addListener(link, 'focus', enter);
          addListener(link, 'blur', leave);
        });

        if (canHover) {
          const statusCards = gsap.utils.toArray<HTMLElement>('.home-island__status-card', root);

          statusCards.forEach((card) => {
            const enter = contextSafe(() => {
              gsap.to(card, {
                y: -4,
                scale: 1.012,
                duration: 0.24,
                ease: 'power2.out',
                overwrite: 'auto',
              });
            });
            const leave = contextSafe(() => {
              gsap.to(card, {
                y: 0,
                scale: 1,
                duration: 0.3,
                ease: 'power3.out',
                overwrite: 'auto',
              });
            });

            addListener(card, 'pointerenter', enter);
            addListener(card, 'pointerleave', leave);
          });
        }

        return () => {
          window.removeEventListener(loadingCompleteEvent, playIntroAfterLoading);
          if (loadingFallbackTimer) {
            window.clearTimeout(loadingFallbackTimer);
          }
          introTimeline.kill();
          cleanups.forEach((cleanup) => cleanup());
          gsap.killTweensOf([...actionLinks, ...featureLinks]);
        };
      },
    );

    return () => mm.revert();
  }, { scope: scopeRef, dependencies: [hasAnimalComponents] });

  if (!animalComponents) {
    return h(
      'div',
      { ref: scopeRef, className: 'home-island-motion-scope' },
      h(
        'main',
        {
          className: 'home-island home-island--loading',
          'aria-labelledby': 'home-title',
        },
        h('section', { className: 'home-island__shell' },
          h('div', { className: 'home-island__intro' }, [
            h(
              'p',
              { key: 'kicker', className: 'home-island__kicker' },
              t(locale, '个人小岛控制台'),
            ),
            h('h1', { key: 'title', id: 'home-title' }, t(locale, 'Island Home')),
          ])),
      ),
    );
  }

  const {
    Card,
    Cursor,
    Divider,
    Footer,
    Icon,
    Phone,
    Time,
    Typewriter,
  } = animalComponents;

  const renderFeatureLink = (item: (typeof featureCards)[number]) => h(
    'a',
    {
      key: item.href,
      className: 'home-island__feature-link',
      href: item.href,
    },
    h(Card, { color: item.color, className: 'home-island__feature-card' }, [
      h(
        'span',
        {
          key: 'shine',
          className: 'home-island__feature-shine',
          'aria-hidden': 'true',
        },
      ),
      h(
        'span',
        {
          key: 'icon-wrap',
          className: 'home-island__feature-icon',
          'aria-hidden': 'true',
        },
        h(Icon, { name: item.icon, size: 34, bounce: true }),
      ),
      h(
        'span',
        { key: 'title', className: 'home-island__feature-title' },
        t(locale, item.title),
      ),
      h(
        'span',
        {
          key: 'description',
          className: 'home-island__feature-description',
        },
        t(locale, item.description),
      ),
    ]),
  );

  const renderStatusCard = (item: (typeof statusItems)[number]) => h(
    Card,
    {
      key: item.label,
      type: 'dashed',
      className: 'home-island__status-card',
    },
    [
      h('span', { key: 'label' }, t(locale, item.label)),
      h('strong', { key: 'value' }, t(locale, item.value)),
    ],
  );

  const topbar = h('div', {
    key: 'topbar',
    className: 'home-island__topbar',
    'aria-label': t(locale, '小岛状态'),
  }, [
    h('a', {
      key: 'brand',
      className: 'home-island__brand',
      href: '/',
      'aria-label': t(locale, '首页'),
    }, [
      h(Icon, { key: 'icon', name: 'icon-map', size: 28, bounce: true }),
      h('span', { key: 'label' }, t(locale, 'Island Home')),
    ]),
    h(Time, { key: 'time', className: 'home-island__time' }),
  ]);

  const intro = h('section', {
    key: 'intro',
    className: 'home-island__intro',
    'aria-labelledby': 'home-title',
  }, [
    h(Card, { key: 'title-card', type: 'title', className: 'home-island__title-card' }, [
      h(
        'p',
        { key: 'kicker', className: 'home-island__kicker' },
        t(locale, '个人小岛控制台'),
      ),
      h('h1', { key: 'title', id: 'home-title' }, t(locale, 'Island Home')),
    ]),
    h(Card, { key: 'dialogue', className: 'home-island__dialogue' }, [
      h(
        'p',
        { key: 'role', className: 'home-island__role' },
        t(locale, '前端开发者 / 摄影爱好者 / 生活记录者'),
      ),
      h(
        Typewriter,
        { key: 'typewriter', speed: 36 },
        h(
          'p',
          null,
          t(locale, '这里会慢慢收集我的前端项目、摄影作品和生活片段。'),
        ),
      ),
    ]),
    h('nav', {
      key: 'actions',
      className: 'home-island__actions',
      'aria-label': t(locale, '首页'),
    }, [
      h('a', {
        key: 'projects',
        className: 'home-island__primary-link',
        href: '/island/projects/',
      }, [
        h(Icon, { key: 'icon', name: 'icon-design', size: 24 }),
        h('span', { key: 'label' }, t(locale, '查看项目')),
      ]),
      h('a', {
        key: 'photos',
        className: 'home-island__secondary-link',
        href: '/island/photos/',
      }, [
        h(Icon, { key: 'icon', name: 'icon-camera', size: 24 }),
        h('span', { key: 'label' }, t(locale, '浏览照片')),
      ]),
    ]),
  ]);

  const phonePanel = h(
    'aside',
    {
      key: 'phone-panel',
      className: 'home-island__phone-panel',
      'aria-label': t(locale, '小岛导航'),
    },
    h(Phone, { className: 'home-island__phone' }),
  );

  const hero = h('div', { key: 'hero', className: 'home-island__hero-grid' }, [
    intro,
    phonePanel,
  ]);

  const shell = h('section', { className: 'home-island__shell' }, [
    topbar,
    hero,
    h(Divider, {
      key: 'divider',
      type: 'wave-yellow',
      className: 'home-island__divider',
    }),
    h(
      'section',
      {
        key: 'features',
        className: 'home-island__feature-grid',
        'aria-label': t(locale, '小岛入口'),
      },
      featureCards.map(renderFeatureLink),
    ),
    h(
      'section',
      {
        key: 'status',
        className: 'home-island__status-grid',
        'aria-label': t(locale, '小岛状态'),
      },
      statusItems.map(renderStatusCard),
    ),
  ]);

  const mainContent = h(
    'main',
    {
      key: 'main',
      className: 'home-island',
      'aria-labelledby': 'home-title',
    },
    shell,
  );

  return h(
    'div',
    { ref: scopeRef, className: 'home-island-motion-scope' },
    h(Cursor, { className: 'home-island__cursor' }, [
      mainContent,
      h(Footer, {
        key: 'footer',
        type: 'sea',
        seamless: true,
        className: 'home-island__footer',
      }),
    ]));
}
