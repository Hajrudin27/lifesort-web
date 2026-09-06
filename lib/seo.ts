import type { Metadata } from 'next';
import { siteDescription, siteUrl } from '@/lib/site-config';

export const siteName = 'LifeSort';
export const defaultTitle = 'LifeSort — Dit liv, samlet ét sted';
export const defaultDescription = siteDescription;
export const defaultOgImage = '/opengraph-image';
export const defaultOgAlt = 'LifeSort — Dit liv, samlet ét sted';

type PageMetadataOptions = {
  title: string;
  description?: string;
  path: `/${string}` | '';
  keywords?: string[];
  absoluteTitle?: boolean;
};

export function absoluteUrl(path: string = '/') {
  return new URL(path || '/', siteUrl).toString();
}

export function createPageMetadata({
  title,
  description = defaultDescription,
  path,
  keywords,
  absoluteTitle = false,
}: PageMetadataOptions): Metadata {
  const canonicalPath = path || '/';
  const fullTitle = absoluteTitle ? title : `${title} — ${siteName}`;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords,
    alternates: {
      canonical: canonicalPath,
    },
    openGraph: {
      title: fullTitle,
      description,
      url: canonicalPath,
      siteName,
      locale: 'da_DK',
      type: 'website',
      images: [
        {
          url: defaultOgImage,
          width: 1200,
          height: 630,
          alt: defaultOgAlt,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title: fullTitle,
      description,
      images: [defaultOgImage],
    },
  };
}
