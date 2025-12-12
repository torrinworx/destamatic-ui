import fs from 'node:fs/promises';
import path from 'node:path';

// Recursively collect all files under a directory
const walkDir = async (dir) => {
    const results = [];

    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
            const nested = await walkDir(fullPath);
            results.push(...nested);
        } else if (entry.isFile()) {
            results.push(fullPath);
        }
    }

    return results;
};

// Convert a file path like /.../dist/blog/index.html to a URL path like /blog/
const htmlPathToRoute = (filePath, outDir) => {
    const rel = path
        .relative(outDir, filePath)
        .replace(/\\/g, '/'); // normalize windows paths

    if (!rel.toLowerCase().endsWith('.html')) return null;

    let withoutExt = rel.slice(0, -5); // strip ".html"

    if (withoutExt === 'index') {
        return '/';
    }

    if (withoutExt.endsWith('/index')) {
        // blog/index -> /blog/
        return '/' + withoutExt.slice(0, -('/index'.length)) + '/';
    }

    // nested/page -> /nested/page
    return '/' + withoutExt;
};

// Build sitemap.xml string from a list of routes
const buildSitemapXml = (routes, baseUrl) => {
    const cleanBase = baseUrl.replace(/\/+$/, ''); // strip trailing slash
    const xmlUrls = routes
        .sort()
        .map((route) => {
            const loc = cleanBase + route;
            return `  <url>\n    <loc>${loc}</loc>\n  </url>`;
        })
        .join('\n');

    return (
        `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n` +
        `${xmlUrls}\n` +
        `</urlset>\n`
    );
};

export const generateSitemap = async ({ outDir, baseUrl }) => {
    if (!baseUrl) {
        throw new Error('generateSitemap: baseUrl is required');
    }

    // Basic guard so you don't accidentally pass "./build" or similar
    if (!/^https?:\/\//i.test(baseUrl)) {
        throw new Error(
            `generateSitemap: baseUrl must be an absolute URL (e.g. "https://example.com"), got "${baseUrl}"`
        );
    }

    console.log('SSG: generating sitemap.xml from', outDir);

    const files = await walkDir(outDir);

    const routeSet = new Set();
    for (const file of files) {
        const route = htmlPathToRoute(file, outDir);
        if (!route) continue;
        routeSet.add(route);
    }

    const routes = [...routeSet];
    const sitemapXml = buildSitemapXml(routes, baseUrl);

    const sitemapPath = path.join(outDir, 'sitemap.xml');
    await fs.writeFile(sitemapPath, sitemapXml, 'utf8');

    console.log('SSG: wrote sitemap.xml with', routes.length, 'routes');
};
