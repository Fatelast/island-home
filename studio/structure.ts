import type { StructureResolver } from 'sanity/structure';

export const structure: StructureResolver = (S) => S.list()
  .id('content-management')
  .title('内容管理')
  .items([
    S.documentTypeListItem('photo').title('相册'),
    S.documentTypeListItem('note').title('文章'),
    S.documentTypeListItem('project').title('项目'),
    S.listItem()
      .id('profile-singleton')
      .title('个人资料')
      .child(
        S.document()
          .schemaType('profile')
          .documentId('profile'),
      ),
  ]);
