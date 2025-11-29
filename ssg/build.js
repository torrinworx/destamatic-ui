import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import './document.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const OUT_DIR = path.resolve(__dirname, '../../build/dist'); // TODO: .env
const BUILD_FILE = path.resolve(__dirname, '../../build/ssg.js');  // TODO: .env

const build = async () => {
	const { renderAppToString } = await import(BUILD_FILE);
	const pages = renderAppToString();

	for (const page of pages) {
		const { route, name, html } = page; // route: folder, name: file base
		// route may be '/', '/blogs/', etc.
		const relRoute = route === '/' ? '' : route.replace(/^\/|\/$/g, '');
		const dir = relRoute ? path.join(OUT_DIR, relRoute) : OUT_DIR;

		await fs.mkdir(dir, { recursive: true });

		const filePath = path.join(dir, name + '.html');
		await fs.writeFile(filePath, html, 'utf8');

		console.log('SSG: wrote', filePath);
	}

	// cleanup, remove temp ssg.js build file.
	fs.unlink(BUILD_FILE, (err) => {
		if (err) {
			console.error('Error deleting file:', err);
			return;
		}
	});
};

build().catch((err) => {
	console.error(err);
	process.exit(1);
});
