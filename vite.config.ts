import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import { isPublicIndexable, publicSiteUrl, renderPublicSeo } from './src/utils/siteSeo.ts';

export default defineConfig(({ mode }) => {
  const rootDir = path.dirname(fileURLToPath(import.meta.url));
  const env = loadEnv(mode, rootDir, '');
  // Only this public URL (never API keys or other environment values) enters the HTML.
  const canonical = publicSiteUrl(process.env.PUBLIC_SITE_URL || env.PUBLIC_SITE_URL);
  const indexing = process.env.PUBLIC_SITE_INDEXING || env.PUBLIC_SITE_INDEXING;
  const allowedHosts = ['localhost', '127.0.0.1', '.e2b.app'];
  if (canonical !== '/') allowedHosts.push(new URL(canonical).hostname);
  return {
    plugins: [react(), tailwindcss(), {
      name: 'code76-public-seo',
      transformIndexHtml(html: string) {
        return renderPublicSeo(html, canonical, isPublicIndexable(canonical, indexing));
      },
    }],
    resolve: { alias: { '@': rootDir } },
    server: {
      host: '0.0.0.0', allowedHosts,
      hmr: process.env.DISABLE_HMR !== 'true',
      // Preserve the low-resource, no-flicker editing setup.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
    preview: { host: '0.0.0.0', allowedHosts },
  };
});
