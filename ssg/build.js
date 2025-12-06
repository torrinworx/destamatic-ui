import fs from 'node:fs/promises';
import path from 'node:path';

import './document.js';

const BUILD_DIR_ARG = process.argv[2];

if (!BUILD_DIR_ARG) {
	console.error('Usage: node ./destamatic-ui/ssg/build.js <BUILD_DIR>');
	process.exit(1);
}

const BUILD_DIR = path.resolve(process.cwd(), BUILD_DIR_ARG);
const OUT_DIR = path.join(BUILD_DIR, 'dist');
const BUILD_FILE = path.join(BUILD_DIR, 'dist', 'index.ssg.js');

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

	try {
		await fs.unlink(BUILD_FILE);
		console.log('SSG: removed', BUILD_FILE);
	} catch (err) {
		console.error('Error deleting file:', err);
	}
};

build().catch((err) => {
	console.error(err);
	process.exit(1);
});
