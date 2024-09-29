import { defineConfig } from 'vite'
import assertRemove from 'destam-dom/transform/assertRemove';
import compileHTMLLiteral from 'destam-dom/transform/htmlLiteral';

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
plugins.push(createTransform('transform-literal-html', compileHTMLLiteral, true, {}));

if (process.env.NODE_ENV === 'production') {
	plugins.push(createTransform('assert-remove', assertRemove));
}

export default defineConfig({
	plugins,
	esbuild: {
		jsx: 'preserve',
	},
	resolve: {
		alias: [
			{find: /^destamatic-ui($|\/)/, replacement: '/src/'},
			{find: '@public', replacement: '/examples'}
		]
	}
});