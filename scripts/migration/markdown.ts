import { createHash } from 'node:crypto';

import { fromMarkdown } from 'mdast-util-from-markdown';

import type {
  Heading,
  List,
  Paragraph,
  PhrasingContent,
  RootContent,
} from 'mdast';

interface PortableTextLink {
  _key: string;
  _type: 'link';
  href: string;
}

interface PortableTextSpan {
  _key: string;
  _type: 'span';
  text: string;
  marks: string[];
}

export interface MigrationPortableTextBlock {
  _key: string;
  _type: 'block';
  style: 'normal' | 'h1' | 'h2' | 'h3';
  markDefs: PortableTextLink[];
  children: PortableTextSpan[];
  listItem?: 'bullet' | 'number';
  level?: number;
}

const keyFor = (value: string) => createHash('sha1')
  .update(value)
  .digest('hex')
  .slice(0, 12);

function inlineText(node: RootContent | PhrasingContent): string {
  if (node.type === 'text' || node.type === 'inlineCode') {
    return node.value;
  }

  if ('children' in node) {
    return node.children.map((child) => inlineText(child)).join('');
  }

  return '';
}

function toChildren(nodes: PhrasingContent[], blockKey: string) {
  const markDefs = new Map<string, PortableTextLink>();
  const children: PortableTextSpan[] = [];

  const visit = (node: PhrasingContent, marks: string[] = []) => {
    if (node.type === 'text' || node.type === 'inlineCode') {
      children.push({
        _key: keyFor(`${blockKey}:${children.length}:${node.value}`),
        _type: 'span',
        text: node.value,
        marks,
      });
      return;
    }

    if (node.type === 'break') {
      children.push({
        _key: keyFor(`${blockKey}:${children.length}:break`),
        _type: 'span',
        text: '\n',
        marks,
      });
      return;
    }

    if (node.type === 'strong' || node.type === 'emphasis') {
      const decorator = node.type === 'strong' ? 'strong' : 'em';
      node.children.forEach((child) => visit(child, [...marks, decorator]));
      return;
    }

    if (node.type === 'link') {
      const markKey = keyFor(`${blockKey}:link:${node.url}`);
      markDefs.set(markKey, {
        _key: markKey,
        _type: 'link',
        href: node.url,
      });
      node.children.forEach((child) => visit(child, [...marks, markKey]));
      return;
    }

    throw new Error(`Unsupported inline Markdown node: ${node.type}`);
  };

  nodes.forEach((node) => visit(node));

  return {
    children,
    markDefs: [...markDefs.values()],
  };
}

function toBlock(
  node: Paragraph | Heading,
  position: string,
  options: {
    listItem?: 'bullet' | 'number';
    level?: number;
  } = {},
): MigrationPortableTextBlock {
  const blockKey = keyFor(`${position}:${node.type}:${inlineText(node)}`);
  const { children, markDefs } = toChildren(node.children, blockKey);
  const style = node.type === 'heading'
    ? `h${node.depth}` as MigrationPortableTextBlock['style']
    : 'normal';

  return {
    _key: blockKey,
    _type: 'block',
    style,
    markDefs,
    children,
    ...options,
  };
}

function appendList(
  blocks: MigrationPortableTextBlock[],
  node: List,
  position: number,
) {
  node.children.forEach((item, itemIndex) => {
    const paragraphs = item.children.filter(
      (child): child is Paragraph => child.type === 'paragraph',
    );

    if (paragraphs.length === 0) {
      throw new Error(`Unsupported empty list item at ${position}:${itemIndex}`);
    }

    if (item.children.some((child) => child.type !== 'paragraph')) {
      throw new Error(`Unsupported nested Markdown list at ${position}:${itemIndex}`);
    }

    paragraphs.forEach((paragraph, paragraphIndex) => {
      blocks.push(toBlock(
        paragraph,
        `${position}:${itemIndex}:${paragraphIndex}`,
        {
          listItem: node.ordered ? 'number' : 'bullet',
          level: 1,
        },
      ));
    });
  });
}

export function markdownToPortableText(
  markdown: string,
): MigrationPortableTextBlock[] {
  const tree = fromMarkdown(markdown);
  const blocks: MigrationPortableTextBlock[] = [];

  tree.children.forEach((node, index) => {
    if (node.type === 'paragraph') {
      blocks.push(toBlock(node, String(index)));
      return;
    }

    if (node.type === 'heading' && node.depth <= 3) {
      blocks.push(toBlock(node, String(index)));
      return;
    }

    if (node.type === 'list') {
      appendList(blocks, node, index);
      return;
    }

    throw new Error(`Unsupported Markdown node: ${node.type}`);
  });

  return blocks;
}
