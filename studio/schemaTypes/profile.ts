import { defineArrayMember, defineField, defineType } from 'sanity';

export const profile = defineType({
  name: 'profile',
  title: '个人资料',
  type: 'document',
  fields: [
    defineField({
      name: 'facts',
      title: '基础信息',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: '名称',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'value',
              title: '内容',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'value',
            },
          },
        }),
      ],
      initialValue: [],
    }),
    defineField({
      name: 'links',
      title: '联系链接',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: '名称',
              type: 'string',
              validation: (rule) => rule.required(),
            }),
            defineField({
              name: 'href',
              title: 'URL',
              type: 'url',
              validation: (rule) => rule.required(),
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'href',
            },
          },
        }),
      ],
      initialValue: [],
    }),
  ],
});
