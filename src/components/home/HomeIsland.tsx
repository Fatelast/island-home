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
  return (
    <Cursor className="home-island__cursor">
      <main className="home-island" aria-labelledby="home-title">
        <section className="home-island__shell">
          <div className="home-island__topbar" aria-label={t(locale, '小岛状态')}>
            <a className="home-island__brand" href="/" aria-label={t(locale, '首页')}>
              <Icon name="icon-map" size={28} bounce />
              <span>{t(locale, 'Island Home')}</span>
            </a>
            <Time className="home-island__time" />
          </div>

          <div className="home-island__hero-grid">
            <section className="home-island__intro" aria-labelledby="home-title">
              <Card type="title" className="home-island__title-card">
                <p className="home-island__kicker">{t(locale, '个人小岛控制台')}</p>
                <h1 id="home-title">{t(locale, 'Island Home')}</h1>
              </Card>

              <Card className="home-island__dialogue">
                <p className="home-island__role">{t(locale, '前端开发者 / 摄影爱好者 / 生活记录者')}</p>
                <Typewriter speed={36}>
                  <p>{t(locale, '这里会慢慢收集我的前端项目、摄影作品和生活片段。')}</p>
                </Typewriter>
              </Card>

              <nav className="home-island__actions" aria-label={t(locale, '首页')}>
                <a className="home-island__primary-link" href="/island/projects/">
                  <Icon name="icon-design" size={24} />
                  <span>{t(locale, '查看项目')}</span>
                </a>
                <a className="home-island__secondary-link" href="/island/photos/">
                  <Icon name="icon-camera" size={24} />
                  <span>{t(locale, '浏览照片')}</span>
                </a>
              </nav>
            </section>

            <aside className="home-island__phone-panel" aria-label={t(locale, '小岛导航')}>
              <Phone className="home-island__phone" />
            </aside>
          </div>

          <Divider type="wave-yellow" className="home-island__divider" />

          <section className="home-island__feature-grid" aria-label={t(locale, '小岛入口')}>
            {featureCards.map((item) => (
              <a key={item.href} className="home-island__feature-link" href={item.href}>
                <Card color={item.color} className="home-island__feature-card">
                  <span className="home-island__feature-icon" aria-hidden="true">
                    <Icon name={item.icon} size={34} bounce />
                  </span>
                  <span className="home-island__feature-title">{t(locale, item.title)}</span>
                  <span className="home-island__feature-description">{t(locale, item.description)}</span>
                </Card>
              </a>
            ))}
          </section>

          <section className="home-island__status-grid" aria-label={t(locale, '小岛状态')}>
            {statusItems.map((item) => (
              <Card key={item.label} type="dashed" className="home-island__status-card">
                <span>{t(locale, item.label)}</span>
                <strong>{t(locale, item.value)}</strong>
              </Card>
            ))}
          </section>
        </section>
      </main>
      <Footer type="sea" className="home-island__footer" />
    </Cursor>
  );
}
