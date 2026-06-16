import { defineField, defineType } from 'sanity';

export const photo = defineType({
  name: 'photo',
  title: '相册',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'alt',
      title: '图片描述',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'location',
      title: '拍摄地点',
      type: 'string',
    }),
    defineField({
      name: 'shotDate',
      title: '拍摄日期',
      type: 'date',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'camera',
      title: '相机',
      type: 'string',
    }),
    defineField({
      name: 'lens',
      title: '镜头',
      type: 'string',
    }),
    defineField({
      name: 'image',
      title: '照片',
      type: 'image',
      options: { hotspot: true },
      validation: (rule) => rule.custom((value) => (
        value ? true : '迁移占位内容可以暂缺图片，新内容发布前应上传图片'
      )).warning(),
    }),
    defineField({
      name: 'tone',
      title: '占位色',
      type: 'string',
      initialValue: 'teal',
      options: {
        list: [
          { title: '青色', value: 'teal' },
          { title: '金色', value: 'gold' },
          { title: '粉色', value: 'pink' },
          { title: '绿色', value: 'green' },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'sortOrder',
      title: '排序',
      type: 'number',
      initialValue: 0,
      validation: (rule) => rule.required().integer(),
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'shotDate',
      media: 'image',
    },
  },
});
