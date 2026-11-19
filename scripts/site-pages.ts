/**
 * The website's plain pages beside the game (milestone 27, SEO): How to play,
 * For parents and teachers, Privacy and the 404 page, plus sitemap.xml. They
 * are static HTML with real text, so search engines and link previews have
 * something to read, while the game itself stays a canvas app.
 *
 * Page bodies live in site/<locale>/*.html (a short header comment gives the
 * title and description); the Privacy page is made from PRIVACY.md so there
 * is one source. Each page is wrapped in one shared layout and stylesheet
 * (site/site.css, inlined) with the game's bundled fonts. Served by the dev server
 * and emitted into the build, where the service worker precaches them too.
 *
 * Like the game: no scripts, nothing from other origins.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Plugin } from 'vite';

export const SITE_URL = 'https://inkykeys.com';

export interface SitePage {
  /** Served at /<slug>/ (the 404 page at /404.html). */
  slug: string;
  title: string;
  description: string;
  body: string;
}

const FONTS: Record<string, string> = {
  'atkinson-400.woff2': '@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-400-normal.woff2',
  'atkinson-700.woff2': '@fontsource/atkinson-hyperlegible-next/files/atkinson-hyperlegible-next-latin-700-normal.woff2',
  'caveat-700.woff2': '@fontsource/caveat/files/caveat-latin-700-normal.woff2',
};

const escapeHtml = (text: string) => text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

/** Inline Markdown: code, bold and links (the little PRIVACY.md uses). Input is escaped first. */
function inline(text: string): string {
  return escapeHtml(text)
    .replace(/`([^`]+)`/g, '<code>$1</code>')
    .replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, label: string, href: string) => `<a href="${href}">${label}</a>`);
}

/** Just enough Markdown for PRIVACY.md: headings, paragraphs and bullet lists. */
export function markdownToHtml(markdown: string): string {
  const out: string[] = [];
  let list: string[] | null = null;
  let paragraph: string[] = [];
  const flush = () => {
    if (paragraph.length) out.push(`<p>${inline(paragraph.join(' '))}</p>`);
    paragraph = [];
    if (list) out.push(`<ul>${list.map((item) => `<li>${inline(item)}</li>`).join('')}</ul>`);
    list = null;
  };
  for (const line of markdown.split('\n')) {
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);
    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (heading) {
      flush();
      const level = heading[1]!.length;
      out.push(`<h${level}>${inline(heading[2]!)}</h${level}>`);
    } else if (bullet) {
      if (paragraph.length) flush();
      (list ??= []).push(bullet[1]!);
    } else if (line.trim() === '') {
      flush();
    } else if (list) {
      list[list.length - 1] += ` ${line.trim()}`;
    } else {
      paragraph.push(line.trim());
    }
  }
  flush();
  return out.join('\n');
}

/** A page body file: `<!-- title: … -->` and `<!-- description: … -->`, then HTML. */
function parsePage(slug: string, source: string): SitePage {
  const field = (name: string) => new RegExp(`<!--\\s*${name}:\\s*([\\s\\S]*?)\\s*-->`).exec(source)?.[1] ?? '';
  const body = source.replace(/<!--[\s\S]*?-->\s*/g, '').trim();
  return { slug, title: field('title'), description: field('description'), body };
}

export function loadPages(root: string, locale = 'en'): SitePage[] {
  const dir = join(root, 'site', locale);
  const pages = readdirSync(dir)
    .filter((file) => file.endsWith('.html'))
    .sort()
    .map((file) => parsePage(file.replace(/\.html$/, ''), readFileSync(join(dir, file), 'utf8')));
  const privacy = readFileSync(join(root, 'PRIVACY.md'), 'utf8').replace(/^# .*\n/, '');
  pages.push({
    slug: 'privacy',
    title: 'Privacy',
    description: 'Inky Keys collects nothing about you: no accounts, analytics, ads or tracking. Your progress stays on your device.',
    body: `<h1>Privacy</h1>\n${markdownToHtml(privacy)}`,
  });
  return pages;
}

const NAV: readonly [string, string][] = [
  ['/how-to-play/', 'How to play'],
  ['/parents-and-teachers/', 'For parents and teachers'],
  ['/privacy/', 'Privacy'],
];

/** The ink-drop logo, as in the game's menu (src/ui/menu.ts). */
const LOGO = `<svg class="logo" viewBox="0 0 390 96" role="img" aria-label="Inky Keys">
  <path class="logo-drop" d="M44 6 L26 48 A21 21 0 1 0 62 48 Z"/>
  <circle class="logo-eye" cx="38" cy="62" r="4.2"/><circle class="logo-eye" cx="52" cy="62" r="4.2"/>
  <circle class="logo-eye" cx="34" cy="50" r="3" opacity="0.5"/>
  <path class="logo-smile" d="M39 72 q6 5 12 0"/>
  <text class="logo-word" x="80" y="70">Inky Keys</text>
  <path class="logo-underline" d="M84 82 C160 74 270 90 366 78"/>
</svg>`;

/** `css`: the shared stylesheet, inlined so nothing blocks the first paint. */
export function renderPage(page: SitePage, css = ''): string {
  const url = page.slug === '404' ? `${SITE_URL}/` : `${SITE_URL}/${page.slug}/`;
  const fullTitle = `${page.title} · Inky Keys`;
  const nav = NAV.map(([href, label]) => {
    const current = href === `/${page.slug}/` ? ' aria-current="page"' : '';
    return `<a href="${href}"${current}>${label}</a>`;
  }).join('\n        ');
  const robots = page.slug === '404' ? '\n    <meta name="robots" content="noindex" />' : '';
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; font-src 'self'" />
    <title>${escapeHtml(fullTitle)}</title>
    <meta name="description" content="${escapeHtml(page.description)}" />${robots}
    <meta name="theme-color" content="#1f2a44" />
    <link rel="canonical" href="${url}" />
    <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
    <link rel="apple-touch-icon" href="/icons/apple-touch-icon.png" />
${Object.keys(FONTS)
  .map((name) => `    <link rel="preload" href="/site/fonts/${name}" as="font" type="font/woff2" crossorigin />\n`)
  .join('')}    <style>
${css.trim()}
    </style>
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="Inky Keys" />
    <meta property="og:title" content="${escapeHtml(fullTitle)}" />
    <meta property="og:description" content="${escapeHtml(page.description)}" />
    <meta property="og:url" content="${url}" />
    <meta property="og:image" content="${SITE_URL}/social-card.png" />
    <meta property="og:image:alt" content="Inky Keys: ink-blot creatures carrying words crawl across a ruled notebook page toward a fountain-pen nib." />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
    <header class="site-header">
      <a class="home" href="/">${LOGO}</a>
      <nav aria-label="Inky Keys pages">
        ${nav}
      </nav>
    </header>
    <main class="page">
${page.body}
      <p class="play"><a class="play-button" href="/">Play Inky Keys</a></p>
    </main>
    <footer class="site-footer">
      <p>Inky Keys is free and open source (<a href="https://github.com/pwbrown/inky-keys">source code</a>). No ads, no accounts, no tracking.</p>
    </footer>
  </body>
</html>
`;
}

export function sitemap(pages: readonly SitePage[], lastmod: string): string {
  const urls = ['', ...pages.filter((p) => p.slug !== '404').map((p) => `${p.slug}/`)];
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((path) => `  <url><loc>${SITE_URL}/${path}</loc><lastmod>${lastmod}</lastmod></url>`).join('\n')}
</urlset>
`;
}

/** Every file the site adds, by its served path. */
function siteFiles(root: string): Map<string, string | Buffer> {
  const pages = loadPages(root);
  const css = readFileSync(join(root, 'site', 'site.css'), 'utf8');
  const files = new Map<string, string | Buffer>();
  for (const page of pages) files.set(page.slug === '404' ? '404.html' : `${page.slug}/index.html`, renderPage(page, css));
  files.set('sitemap.xml', sitemap(pages, new Date().toISOString().slice(0, 10)));
  for (const [name, path] of Object.entries(FONTS)) files.set(`site/fonts/${name}`, readFileSync(join(root, 'node_modules', path)));
  return files;
}

const TYPES: Record<string, string> = { html: 'text/html', xml: 'application/xml', woff2: 'font/woff2' };

export function sitePages(root: string): Plugin {
  return {
    name: 'inky-keys-site-pages',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        const path = (req.url ?? '/').split('?')[0]!.replace(/^\//, '');
        const files = siteFiles(root);
        const file = files.get(path) ?? files.get(`${path.replace(/\/?$/, '/')}index.html`);
        if (path === '' || file === undefined) return next();
        if (!path.endsWith('/') && !path.includes('.')) {
          res.statusCode = 301;
          res.setHeader('Location', `/${path}/`);
          return res.end();
        }
        const ext = path.endsWith('/') ? 'html' : (path.split('.').pop() ?? '');
        res.setHeader('Content-Type', TYPES[ext] ?? 'application/octet-stream');
        res.end(file);
      });
    },
    generateBundle() {
      for (const [fileName, source] of siteFiles(root)) this.emitFile({ type: 'asset', fileName, source });
    },
  };
}
