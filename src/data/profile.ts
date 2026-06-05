export interface ProfileFact {
  label: string;
  value: string;
}

export interface ProfileLink {
  label: string;
  href: string;
}

export const profileFacts: ProfileFact[] = [
  {
    label: '身份',
    value: '前端开发者',
  },
  {
    label: '关注方向',
    value: '用户界面、交互体验和静态内容站点',
  },
  {
    label: '摄影设备',
    value: '相机和镜头信息待补充',
  },
  {
    label: '内容计划',
    value: '项目、摄影和生活文章会分阶段补齐',
  },
];

export const profileLinks: ProfileLink[] = [
  {
    label: 'GitHub',
    href: 'https://github.com/Fatelast',
  },
  {
    label: '项目仓库',
    href: 'https://github.com/Fatelast/island-home',
  },
];
