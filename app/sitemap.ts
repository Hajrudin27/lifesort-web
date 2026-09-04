import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-config';
import { modules } from '@/lib/modules-content';

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = ['', '/faq', '/support', '/privacy', '/terms'];
  const moduleRoutes = modules.map((m) => `/modules/${m.slug}`);

  return [...routes, ...moduleRoutes].map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
  }));
}