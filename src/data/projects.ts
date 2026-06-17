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
    title: 'SaveMyParking（挪车宝）',
    summary: '记录停车时间、提醒挪车并保存停车位置的双端工具，当前同时提供 Web 和微信小程序实现。',
    status: '持续迭代',
    techStack: ['TypeScript', 'React', 'Vite', '微信小程序'],
    repoUrl: 'https://github.com/Fatelast/car-move',
    coverTone: 'mint',
  },
  {
    title: 'My Skill Project',
    summary: '按独立目录组织个人 Codex skills，沉淀可单独安装、维护和复用的能力包集合。',
    status: '持续维护',
    techStack: ['Python', 'Codex Skills', 'Markdown'],
    repoUrl: 'https://github.com/Fatelast/My-Skill-Project',
    coverTone: 'sunset',
  },
  {
    title: 'RedSaver（小红书无水印下载）',
    summary: '解析小红书帖子链接，支持批量下载无水印高清原图，并通过 Gemini 为图片生成更易识别的文件名。',
    status: '原型可用',
    techStack: ['TypeScript', 'React', 'Vite', 'Gemini API'],
    repoUrl: 'https://github.com/Fatelast/RedBookImg',
    coverTone: 'sky',
  },
];
