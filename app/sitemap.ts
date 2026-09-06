import type { MetadataRoute } from 'next';
import { siteUrl } from '@/lib/site-config';
import { modules } from '@/lib/modules-content';

const lastModified = new Date('2026-09-06T00:00:00.000Z');

export default function sitemap(): MetadataRoute.Sitemap {
  const routes = [
    { path: '', changeFrequency: 'weekly' as const, priority: 1 },
    { path: '/faq', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/support', changeFrequency: 'monthly' as const, priority: 0.7 },
    { path: '/sikkerhed', changeFrequency: 'monthly' as const, priority: 0.65 },
    { path: '/appcheck', changeFrequency: 'monthly' as const, priority: 0.65 },
    { path: '/privacy', changeFrequency: 'yearly' as const, priority: 0.3 },
    { path: '/terms', changeFrequency: 'yearly' as const, priority: 0.3 },
  ];
  const moduleRoutes = modules.map((m) => ({
    path: `/modules/${m.slug}`,
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  return [...routes, ...moduleRoutes].map((route) => ({
    url: `${siteUrl}${route.path}`,
    lastModified,
    changeFrequency: route.changeFrequency,
    priority: route.priority,
  }));
}
