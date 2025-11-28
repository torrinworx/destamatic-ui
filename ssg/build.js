import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import './document.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '../../build/dist');

const build = async () => {
	const { renderAppToString } = await import('../../build/server/ssg-entry.js');
	const pages = renderAppToString();

	for (const page of pages) {
		const { route, name, html } = page; // TODO: minifi html before? 

		await fs.mkdir(path.join(OUT_DIR, route), { recursive: true });

		console.log("WRITING:", route, name + '.html');

		await fs.writeFile(
			path.join(OUT_DIR, route, name + '.html'),
			html,
			'utf8'
		);

		console.log('SSG: wrote', path.join(OUT_DIR, route, name + '.html'));
	}
}

build().catch(err => {
	console.error(err);
	process.exit(1);
});
