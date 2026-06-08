import {
  Card,
  Cursor,
  Divider,
  Footer,
  Icon,
  Phone,
  Time,
  Typewriter,
} from 'animal-island-ui';
import { useGSAP } from '@gsap/react';
import { gsap } from 'gsap';
import { createElement as h, useRef } from 'react';

import { t } from '../../i18n';

import './HomeIsland.css';

gsap.registerPlugin(useGSAP);

interface HomeIslandProps {
  locale: string;
}

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

  useGSAP(() => {
    const mm = gsap.matchMedia();

    mm.add(
      {
        reduceMotion: '(prefers-reduced-motion: reduce)',
        isDesktop: '(min-width: 921px)',
      },
      (context) => {
        const { reduceMotion, isDesktop } = context.conditions ?? {};

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

        const introTimeline = gsap.timeline({ defaults: { ease: 'power3.out', duration: 0.72 } });

        introTimeline
          .from('.home-island__topbar', { y: -18, autoAlpha: 0 })
          .from('.home-island__title-card', { y: 34, scale: 0.98, autoAlpha: 0 }, '-=0.34')
          .from('.home-island__dialogue', { y: 26, autoAlpha: 0 }, '-=0.46')
          .from('.home-island__actions > a', { y: 16, autoAlpha: 0, stagger: 0.08 }, '-=0.42')
          .from('.home-island__phone-panel', { x: isDesktop ? 42 : 0, y: 24, rotation: 1.8, autoAlpha: 0 }, '-=0.6')
          .from('.home-island__divider', { scaleX: 0.7, autoAlpha: 0 }, '-=0.25')
          .from('.home-island__feature-link', { y: 24, autoAlpha: 0, stagger: 0.08 }, '-=0.22')
          .from('.home-island__status-card', { y: 18, autoAlpha: 0, stagger: 0.06 }, '-=0.36');

        gsap.to('.home-island__phone', {
          y: -10,
          rotation: '+=1.2',
          duration: 3.2,
          ease: 'sine.inOut',
          repeat: -1,
          yoyo: true,
        });

        return undefined;
      },
    );

    return () => mm.revert();
  }, { scope: scopeRef });

  return h('div', { ref: scopeRef, className: 'home-island-motion-scope' }, h(Cursor, { className: 'home-island__cursor' }, [
    h('main', { key: 'main', className: 'home-island', 'aria-labelledby': 'home-title' },
      h('section', { className: 'home-island__shell' }, [
        h('div', { key: 'topbar', className: 'home-island__topbar', 'aria-label': t(locale, '小岛状态') }, [
          h('a', { key: 'brand', className: 'home-island__brand', href: '/', 'aria-label': t(locale, '首页') }, [
            h(Icon, { key: 'icon', name: 'icon-map', size: 28, bounce: true }),
            h('span', { key: 'label' }, t(locale, 'Island Home')),
          ]),
          h(Time, { key: 'time', className: 'home-island__time' }),
        ]),
        h('div', { key: 'hero', className: 'home-island__hero-grid' }, [
          h('section', { key: 'intro', className: 'home-island__intro', 'aria-labelledby': 'home-title' }, [
            h(Card, { key: 'title-card', type: 'title', className: 'home-island__title-card' }, [
              h('p', { key: 'kicker', className: 'home-island__kicker' }, t(locale, '个人小岛控制台')),
              h('h1', { key: 'title', id: 'home-title' }, t(locale, 'Island Home')),
            ]),
            h(Card, { key: 'dialogue', className: 'home-island__dialogue' }, [
              h('p', { key: 'role', className: 'home-island__role' }, t(locale, '前端开发者 / 摄影爱好者 / 生活记录者')),
              h(Typewriter, { key: 'typewriter', speed: 36 },
                h('p', null, t(locale, '这里会慢慢收集我的前端项目、摄影作品和生活片段。'))),
            ]),
            h('nav', { key: 'actions', className: 'home-island__actions', 'aria-label': t(locale, '首页') }, [
              h('a', { key: 'projects', className: 'home-island__primary-link', href: '/island/projects/' }, [
                h(Icon, { key: 'icon', name: 'icon-design', size: 24 }),
                h('span', { key: 'label' }, t(locale, '查看项目')),
              ]),
              h('a', { key: 'photos', className: 'home-island__secondary-link', href: '/island/photos/' }, [
                h(Icon, { key: 'icon', name: 'icon-camera', size: 24 }),
                h('span', { key: 'label' }, t(locale, '浏览照片')),
              ]),
            ]),
          ]),
          h('aside', { key: 'phone-panel', className: 'home-island__phone-panel', 'aria-label': t(locale, '小岛导航') },
            h(Phone, { className: 'home-island__phone' })),
        ]),
        h(Divider, { key: 'divider', type: 'wave-yellow', className: 'home-island__divider' }),
        h('section', { key: 'features', className: 'home-island__feature-grid', 'aria-label': t(locale, '小岛入口') },
          featureCards.map((item) => h('a', { key: item.href, className: 'home-island__feature-link', href: item.href },
            h(Card, { color: item.color, className: 'home-island__feature-card' }, [
              h('span', { key: 'icon-wrap', className: 'home-island__feature-icon', 'aria-hidden': 'true' },
                h(Icon, { name: item.icon, size: 34, bounce: true })),
              h('span', { key: 'title', className: 'home-island__feature-title' }, t(locale, item.title)),
              h('span', { key: 'description', className: 'home-island__feature-description' },
                t(locale, item.description)),
            ])))),
        h('section', { key: 'status', className: 'home-island__status-grid', 'aria-label': t(locale, '小岛状态') },
          statusItems.map((item) => h(Card, { key: item.label, type: 'dashed', className: 'home-island__status-card' }, [
            h('span', { key: 'label' }, t(locale, item.label)),
            h('strong', { key: 'value' }, t(locale, item.value)),
          ]))),
      ])),
    h(Footer, { key: 'footer', type: 'sea', className: 'home-island__footer' }),
  ]));
}
