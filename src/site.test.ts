import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { SITE_URL, loadPages, markdownToHtml, renderPage, sitemap } from '../scripts/site-pages.ts';

const root = fileURLToPath(new URL('..', import.meta.url));

describe('website pages (scripts/site-pages.ts)', () => {
  const pages = loadPages(root);

  it('has the guide, parents, privacy and 404 pages, each with a title and a search-sized description', () => {
    expect(pages.map((p) => p.slug).sort()).toEqual(['404', 'how-to-play', 'parents-and-teachers', 'privacy']);
    for (const page of pages) {
      expect(page.title, page.slug).toBeTruthy();
      expect(page.description.length, page.slug).toBeGreaterThan(20);
      expect(page.description.length, page.slug).toBeLessThanOrEqual(170);
      expect(page.body, page.slug).toMatch(/<h1>/);
    }
  });

  it('renders canonical links, previews and no scripts', () => {
    for (const page of pages) {
      const html = renderPage(page, 'body{}');
      expect(html).toContain(`<link rel="canonical" href="${SITE_URL}/${page.slug === '404' ? '' : `${page.slug}/`}"`);
      expect(html).toContain('og:image');
      expect(html).not.toMatch(/<script/);
      expect(html.includes('noindex')).toBe(page.slug === '404');
    }
  });

  it('lists every page but the 404 in the sitemap', () => {
    const xml = sitemap(pages, '2026-11-19');
    expect(xml).toContain(`<loc>${SITE_URL}/</loc>`);
    expect(xml).toContain(`<loc>${SITE_URL}/privacy/</loc>`);
    expect(xml).not.toContain('404');
  });

  it('turns PRIVACY.md-style Markdown into safe HTML', () => {
    expect(markdownToHtml('## Hi\n\nSome **bold** and `code` <b>, [a link](https://x.org).\n\n- one\n- two\n  more')).toBe(
      '<h2>Hi</h2>\n<p>Some <strong>bold</strong> and <code>code</code> &lt;b&gt;, <a href="https://x.org">a link</a>.</p>\n<ul><li>one</li><li>two more</li></ul>',
    );
  });
});
