export interface ProjectItem {
  title: string;
  summary: string;
  status: string;
  techStack: string[];
  repoUrl?: string;
  demoUrl?: string;
  coverTone: 'mint' | 'sunset' | 'sky';
}

export const projects: ProjectItem[] = [
  {
    title: '个人主页重构',
    summary: '使用 Astro、React 和 animal-island-ui 搭建个人小岛式作品主页。',
    status: '正在搭建',
    techStack: ['Astro', 'React', 'TypeScript'],
    repoUrl: 'https://github.com/Fatelast/island-home',
    demoUrl: '/',
    coverTone: 'mint',
  },
  {
    title: '移动端业务工具',
    summary: '沉淀移动端页面结构、表单流程和轻量交互组件的实践记录。',
    status: '整理中',
    techStack: ['React', 'Taro', 'CSS'],
    coverTone: 'sunset',
  },
  {
    title: '交互组件实验室',
    summary: '记录按钮、卡片、弹层和动效组合的可复用前端片段。',
    status: '计划中',
    techStack: ['React', 'Animation', 'UI'],
    coverTone: 'sky',
  },
];
