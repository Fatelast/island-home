import {
  PortableText as PortableTextRenderer,
} from '@portabletext/react';

import { sanityConfig } from '../../lib/content/client';
import { createContentImageUrl } from '../../lib/content/image';

import type { PortableTextComponents } from '@portabletext/react';
import type { ReactNode } from 'react';
import type {
  PortableTextContent,
  PortableTextImage,
} from '../../lib/content/types';

interface Props {
  value: PortableTextContent;
}

const components = {
  types: {
    image: ({ value }: { value: PortableTextImage }) => {
      if (!value.asset || !sanityConfig) {
        return null;
      }

      return (
        <img
          src={createContentImageUrl(sanityConfig, value)}
          alt={value.alt ?? ''}
          loading="lazy"
          decoding="async"
        />
      );
    },
  },
  marks: {
    link: ({
      children,
      value,
    }: {
      children: ReactNode;
      value?: { href?: string };
    }) => {
      const href = value?.href;
      if (!href) {
        return children;
      }

      const external = /^https?:\/\//.test(href);
      return (
        <a
          href={href}
          target={external ? '_blank' : undefined}
          rel={external ? 'noreferrer' : undefined}
        >
          {children}
        </a>
      );
    },
  },
} satisfies PortableTextComponents;

export default function PortableText({ value }: Props) {
  return (
    <PortableTextRenderer
      value={value}
      components={components}
    />
  );
}
