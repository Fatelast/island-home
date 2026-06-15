import { defineArrayMember, defineField, defineType } from 'sanity';

export const blockContent = defineType({
  name: 'blockContent',
  title: '正文',
  type: 'array',
  of: [
    defineArrayMember({
      type: 'block',
      styles: [
        { title: '正文', value: 'normal' },
        { title: '一级标题', value: 'h1' },
        { title: '二级标题', value: 'h2' },
        { title: '三级标题', value: 'h3' },
      ],
      marks: {
        annotations: [
          defineArrayMember({
            name: 'link',
            title: '链接',
            type: 'object',
            fields: [
              defineField({
                name: 'href',
                title: 'URL',
                type: 'url',
                validation: (rule) => rule.required(),
              }),
            ],
          }),
        ],
      },
    }),
    defineArrayMember({
      type: 'image',
      options: { hotspot: true },
      fields: [
        defineField({
          name: 'alt',
          title: '图片描述',
          type: 'string',
          validation: (rule) => rule.required(),
        }),
      ],
    }),
  ],
});
