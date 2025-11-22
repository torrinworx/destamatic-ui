import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


import './document.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '../../build/dist');

async function build() {
    const prevDocument = globalThis.document;
    const prevNode = globalThis.Node;
    const prevDOMParser = globalThis.DOMParser;

    try {
        const { renderAppToString } = await import('../../build/server/ssg-entry.js');
        const appHtml = renderAppToString();
        const html = `<!doctype html>
<html lang="en" class="no-js">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <link rel="icon" href="./favicon.svg" sizes="any" type="image/svg+xml">
    <title>Destamatic SSG Test</title>
  </head>
  <body>
    ${appHtml}
    <script type="module" src="./index.jsx"></script>
  </body>
</html>
`;

        await fs.mkdir(OUT_DIR, { recursive: true });
        await fs.writeFile(path.join(OUT_DIR, 'index.html'), html, 'utf8');

        console.log('SSG: wrote', path.join(OUT_DIR, 'index.html'));
    } finally {
        globalThis.document = prevDocument;
        globalThis.Node = prevNode;
        globalThis.DOMParser = prevDOMParser;
    }
}

build().catch(err => {
    console.error(err);
    process.exit(1);
});
