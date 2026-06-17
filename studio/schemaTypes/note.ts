import { defineField, defineType } from 'sanity';

export const note = defineType({
  name: 'note',
  title: '文章',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: '标题',
      type: 'string',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'slug',
      title: '访问路径',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'description',
      title: '摘要',
      type: 'text',
      rows: 3,
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'publishedAt',
      title: '发布日期',
      type: 'datetime',
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: 'tags',
      title: '标签',
      type: 'array',
      of: [{ type: 'string' }],
      initialValue: [],
    }),
    defineField({
      name: 'body',
      title: '正文',
      type: 'blockContent',
      description: '推荐使用富文本维护正文；如填写 Markdown 正文，可留空。',
      validation: (rule) => rule.custom((value, context) => {
        const document = context.document as { bodyMarkdown?: string } | undefined;
        const hasMarkdown = Boolean(document?.bodyMarkdown?.trim());
        const hasPortableText = Array.isArray(value) && value.length > 0;

        return hasPortableText || hasMarkdown
          ? true
          : '正文或 Markdown 正文至少填写一项';
      }),
    }),
    defineField({
      name: 'bodyMarkdown',
      title: 'Markdown 正文',
      type: 'text',
      rows: 18,
      description: '可选：用于直接粘贴 Markdown。当前支持标题、段落、链接和列表；图片建议继续使用富文本图片块维护。',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'publishedAt',
    },
  },
});
