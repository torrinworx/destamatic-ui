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
		console.log("THIS IS APPHTML: ", appHtml);
		console.log(appHtml.length);

		// not sure how to handle nested stage contexts? 
		for (const stageHtml of appHtml) {
			const html = `<!doctype html>
			<html lang="en" class="no-js">
				<head>
					<meta charset="UTF-8" />
					<meta name="viewport" content="width=device-width, initial-scale=1.0" />
					<link rel="icon" href="./favicon.svg" sizes="any" type="image/svg+xml">
					<title>Destamatic SSG Test</title>
				</head>
				<body>
					${stageHtml.html}
					<script type="module" src="./index.jsx"></script>
				</body>
			</html>`;

			await fs.mkdir(path.join(OUT_DIR, stageHtml.route), { recursive: true });

			console.log("WRITING: ", stageHtml.route, stageHtml.name + '.html');

			await fs.writeFile(
				path.join(OUT_DIR, stageHtml.route, stageHtml.name + '.html'),
				html,
				'utf8'
			);

			console.log('SSG: wrote', path.join(OUT_DIR, stageHtml.route, stageHtml.name + '.html'));
		}

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
