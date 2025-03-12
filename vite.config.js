import { defineConfig } from 'vite';
import assertRemove from 'destam-dom/transform/assertRemove';
import compileHTMLLiteral from 'destam-dom/transform/htmlLiteral';
import fs from 'fs';
import { resolve, join } from 'path';

const createTransform = (name, transform, jsx, options) => ({
	name,
	transform(code, id) {
		if (id.endsWith('.js') || (jsx && id.endsWith('.jsx'))) {
			const transformed = transform(code, {
				sourceFileName: id,
				plugins: id.endsWith('.jsx') ? ['jsx'] : [],
				...options,
			});
			return {
				code: transformed.code,
				map: transformed.decodedMap,
			};
		}
	}
});

const plugins = [];
plugins.push(createTransform('transform-literal-html', compileHTMLLiteral, true, {
	jsx_auto_import: {
		'h': 'destamatic-ui',
		'mark': 'destamatic-ui',
		'raw': { name: 'h', location: 'destam-dom' },
	},
}));

if (process.env.NODE_ENV === 'production') {
	plugins.push(createTransform('assert-remove', assertRemove));
}

const recursiveReadDir = (dir, fileList = []) => {
	fs.readdirSync(dir, { withFileTypes: true }).forEach((entry) => {
		const fullPath = resolve(dir, entry.name);
		if (entry.isDirectory()) {
			recursiveReadDir(fullPath, fileList);
		} else if (entry.name.endsWith('.js') || entry.name.endsWith('.jsx')) {
			fileList.push(fullPath);
		}
	});
	return fileList;
};

const getExample = name => {
	name = name.endsWith('.html') ? name.slice(0, -5) : name + 'index';
	name = name.startsWith('/') ? name.slice(1) : name;
	const variants = ['.js', '.jsx', '.example.js', '.example.jsx'];
	const existed = variants.find(v => fs.existsSync(resolve(__dirname, 'examples', name + v)));
	if (!existed) return null;
	const relative = '/' + name + '.html';
	return {
		name,
		file: name + existed,
		relative,
		location: resolve(__dirname, 'examples', name + existed),
		resolved: join(__dirname, relative),
	};
};

let examples;
const getExamples = () => {
	if (examples) return examples;
	const examplesDir = resolve(__dirname, 'examples');
	return examples = recursiveReadDir(examplesDir).map(fullPath => {
		const relativePath = fullPath.substring(fullPath.indexOf('examples') + 'examples/'.length);
		const name = relativePath.substring(0, relativePath.lastIndexOf('.'));
		return getExample(`/${name}.html`);
	}).filter(Boolean);
};

const generateTemplate = (entry, hot) => {
	return `
		<!doctype html>
		<html lang="en">
			${hot ? '<script type="module" src="/@vite/client"></script>' : ""}
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Destamatic UI - ${entry.name}</title>
				<link rel="icon" href="data:;base64,iVBORw0KGgo=">
			</head>
			<body>
				<div id="app"></div>
				<script type="module" src="/examples/${entry.file}"></script>
			</body>
		</html>
	`.trim();
};

plugins.push({
	name: 'examples',
	resolveId(id) {
		let found = getExamples().find(ex => ex.resolved === id);
		if (found) {
			return found.resolved;
		}
	},
	load(id) {
		let found = getExamples().find(ex => ex.resolved === id);
		if (found) return generateTemplate(found);
	},
	configureServer(server) {
		server.middlewares.use((req, res, next) => {
			let found = getExample(req.originalUrl);
			if (found) {
				res.end(generateTemplate(found, true));
			} else {
				next();
			}
		});
	},
});

export default defineConfig({
	plugins,
	esbuild: {
		jsx: 'preserve',
	},
	resolve: {
		alias: [
			{ find: /^destamatic-ui($|\/)/, replacement: '/' },
			{ find: '@public', replacement: '/examples' },
		]
	}
});
