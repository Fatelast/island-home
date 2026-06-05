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
import { createElement as h } from 'react';

import { t } from '../../i18n';

import './HomeIsland.css';

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
  return h(Cursor, { className: 'home-island__cursor' }, [
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
  ]);
}
