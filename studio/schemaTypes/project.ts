import { defineField, defineType } from 'sanity';

export const project = defineType({
  name: 'project',
  title: '项目',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'summary',
      title: '简介',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'status',
      title: '状态',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'techStack',
      title: '技术栈',
      type: 'array',
      of: [{ type: 'string' }],
      initialValue: [],
    }),
    defineField({
      name: 'repoUrl',
      title: '仓库地址',
      type: 'url',
    }),
    defineField({
      name: 'demoUrl',
      title: '预览地址',
      type: 'url',
    }),
    defineField({
      name: 'coverImage',
      title: '封面',
      type: 'image',
      options: { hotspot: true },
    }),
    defineField({
      name: 'coverTone',
      title: '占位色',
      type: 'string',
      options: {
        list: [
          { title: '薄荷绿', value: 'mint' },
          { title: '日落色', value: 'sunset' },
          { title: '天空蓝', value: 'sky' },
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
      subtitle: 'status',
      media: 'coverImage',
    },
  },
});
