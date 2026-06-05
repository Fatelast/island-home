export interface PhotoItem {
  title: string;
  alt: string;
  location: string;
  date: string;
  camera: string;
  lens: string;
  thumbnail?: string;
  original?: string;
  color: 'teal' | 'gold' | 'pink' | 'green';
}

export const photos: PhotoItem[] = [
  {
    title: '傍晚的海风',
    alt: '傍晚海边步道的摄影占位图',
    location: '海边步道',
    date: '2026-05-18',
    camera: '相机待补充',
    lens: '镜头待补充',
    thumbnail: '',
    original: '',
    color: 'teal',
  },
  {
    title: '路边的晴天',
    alt: '晴天城市街角的摄影占位图',
    location: '城市街角',
    date: '2026-05-02',
    camera: '相机待补充',
    lens: '镜头待补充',
    thumbnail: '',
    original: '',
    color: 'gold',
  },
  {
    title: '午后植物影子',
    alt: '午后阳台植物影子的摄影占位图',
    location: '阳台',
    date: '2026-04-21',
    camera: '相机待补充',
    lens: '镜头待补充',
    thumbnail: '',
    original: '',
    color: 'green',
  },
  {
    title: '粉色日落',
    alt: '河岸粉色日落的摄影占位图',
    location: '河岸',
    date: '2026-04-08',
    camera: '相机待补充',
    lens: '镜头待补充',
    thumbnail: '',
    original: '',
    color: 'pink',
  },
];
