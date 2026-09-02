import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-config';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/faq', '/support', '/privacy', '/terms'];

  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}