import { defineConfig } from 'vite'
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
		'raw': {name: 'h', location: 'destam-dom'},
	},
}));

if (process.env.NODE_ENV === 'production') {
	plugins.push(createTransform('assert-remove', assertRemove));
}

const getExample = (file) => {
	if (file === '/') file = '/index.html';
	if (!file.startsWith('/') || !file.endsWith('.html')) return null;

	file = file.substring(1);
	let i = file.lastIndexOf('.');
	const name = file.substring(0, i);

	const existed = ['.js', '.jsx'].find(ex => fs.existsSync('examples/' + name + ex));
	if (!existed) {
		return null;
	}

	const relative = '/' + name + '.html';
	return {
		name,
		file: name + existed,
		relative,
		location: resolve(__dirname, '/examples/' + name + existed),
		resolved: join(__dirname, relative),
	};
};

let examples;
const getExamples = () => {
	if (examples) {
		return examples;
	}

	return examples = fs.readdirSync(resolve(__dirname, 'examples')).map(file => {
		let i = file.lastIndexOf('.');
		const name = file.substring(0, i);

		return getExample('/' + name + '.html');
	});
};

const generateTemplate = (entry, hot) => {
	return `
		<!doctype html>
		<html lang="en">
			${hot ? '<script type="module" src="/@vite/client"></script>' : ""}
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1.0" />
				<title>Destamatic UI</title>
			</head>
			<body>
				<script type="module" src="./examples/${entry.file}"></script>
			</body>
		</html>
	`;
};

plugins.push({
	name: 'examples',
	resolveId (id) {
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
})

export default defineConfig({
	plugins,
	esbuild: {
		jsx: 'preserve',
	},
	resolve: {
		alias: [
			{find: /^destamatic-ui($|\/)/, replacement: '/'},
			{find: '@public', replacement: '/examples'}
		]
	}
});
