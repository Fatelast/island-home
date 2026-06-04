export const sourceTextKeys = {
  首页: 'nav.home',
  项目作品: 'nav.projects',
  摄影作品: 'nav.photos',
  生活记录: 'nav.notes',
  关于我: 'nav.about',
  'Island Home': 'site.name',
  '个人小岛': 'site.tagline',
  '前端开发者 / 摄影爱好者 / 生活记录者': 'home.hero.role',
  '这里会慢慢收集我的前端项目、摄影作品和生活片段。': 'home.hero.description',
  '查看项目': 'home.hero.projectsAction',
  '浏览照片': 'home.hero.photosAction',
} as const;

export type SourceText = keyof typeof sourceTextKeys;
export type MessageKey = (typeof sourceTextKeys)[SourceText];

export const messages = {
  'zh-CN': {
    'nav.home': '首页',
    'nav.projects': '项目作品',
    'nav.photos': '摄影作品',
    'nav.notes': '生活记录',
    'nav.about': '关于我',
    'site.name': 'Island Home',
    'site.tagline': '个人小岛',
    'home.hero.role': '前端开发者 / 摄影爱好者 / 生活记录者',
    'home.hero.description': '这里会慢慢收集我的前端项目、摄影作品和生活片段。',
    'home.hero.projectsAction': '查看项目',
    'home.hero.photosAction': '浏览照片',
  },
  en: {
    'nav.home': 'Home',
    'nav.projects': 'Projects',
    'nav.photos': 'Photography',
    'nav.notes': 'Notes',
    'nav.about': 'About',
    'site.name': 'Island Home',
    'site.tagline': 'Personal Island',
    'home.hero.role': 'Frontend Developer / Photography Enthusiast / Life Logger',
    'home.hero.description': 'A growing place for my frontend projects, photography work, and life notes.',
    'home.hero.projectsAction': 'View Projects',
    'home.hero.photosAction': 'Browse Photos',
  },
} as const satisfies Record<string, Record<MessageKey, string>>;
