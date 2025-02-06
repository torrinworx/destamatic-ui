/* node:coverage disable */

import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {describe, it} from 'node:test';
import {transformBabelAST as staticMount} from 'destam-dom/transform/staticMount.js';
import {transformBabelAST as htmlLiteral} from 'destam-dom/transform/htmlLiteral.js';
import parser from '@babel/parser';
import t from '@babel/types';
import generate from '@babel/generator';

const self = fileURLToPath(import.meta.url);

const transform = (file, options) => async () => {
	let source = fs.readFileSync(path.resolve(self, '..', file)).toString();
	const ast = parser.parse(source, {
		sourceType: 'module',
		code: false,
		ast: true,
		plugins: file.endsWith('.jsx') ? ['jsx'] : [],
	});

	htmlLiteral(ast);
	staticMount(ast, options);

	const context = {};

	// replace imports
	for (let i = 0; i < ast.program.body.length; i++) {
		const child = ast.program.body[i];
		if (child.type === 'ImportDeclaration') {
			ast.program.body.splice(i--, 1);

			const mod = options.override_import?.[child.source.value] || await import(child.source.value);
			for (const spec of child.specifiers) {
				if (!spec.imported) {
					context[spec.local.name] = mod.default;
				} else {
					context[spec.local.name] = mod[spec.imported.name];
				}
			}
		}
	}

	const code = generate.default(ast, {}, source).code;

	for (let o in global) {
		if (!(o in context)) context[o] = global[o];
	}

	let parsed;
	const parse = () => {
		if (parsed) return parsed;

		const ast = parser.parse(code, {
			sourceType: 'module',
			code: false,
			ast: true,
		});

		parsed = new Map();
		for (const statement of ast.program.body) {
			if (statement.type !== 'ExpressionStatement') continue;
			if (statement.expression.type !== 'CallExpression') continue;
			if (statement.expression.callee.type !== 'Identifier') continue;
			if (statement.expression.callee.name !== 'test') continue;
			if (statement.expression.arguments[0].type !== 'StringLiteral') continue;

			parsed.set(statement.expression.arguments[0].value, statement.loc);
		}

		return parsed;
	};

	if (context.test) context.test = (name, impl) => {
		it(name, () => {
			try {
				return impl();
			} catch (e) {
				let lines = code.split('\n').map((line, num) => (num + 1) + " " + line);
				const stuff = parse();

				if (stuff.has(name)) {
					const loc = stuff.get(name);
					lines = lines.slice(loc.start.line - 1, loc.end.line);
				}

				throw new Error('\n' + lines.join("\n"), {cause: e});
			}
		});
	};

	const script = new vm.Script(code, {
		filename: file,
	});

	vm.createContext(context);
	script.runInContext(context);
}

const iife = path.resolve(self, '../../dist/destam-dom.iife.js');
let hasIife = fs.existsSync(iife);
if (hasIife) {
	const script = new vm.Script(fs.readFileSync(iife), {
		filename: 'destam-dom.iife.js',
	});

	script.runInThisContext();
}

const files = fs.readdirSync(path.resolve(self, '..')).filter(file =>
	// we don't want to recursively run the transforms
	file !== path.basename(self) &&

	// don't run the assert tests because those are meant to test the asserts
	// only present in debug builds. The static analysis tools are meant to run
	// for production builds only, so debug asserts are not present.
	file !== 'assert.test.js' &&
	(file.endsWith('.test.js') || file.endsWith('.test.jsx'))
);

for (const file of files) {
	describe("transform with util " + file, transform(file, {
		util_import: '..',
		assure_import: /^\.\.\/index\.js$/,
	}));

	describe("transform " + file, transform(file, {
		assure_import: /^\.\.\/index\.js$/,
	}));

	// Test the iffe with the baseline tests. Baseline tests are those tests
	// that can run on the limited release build.
	if (hasIife && file.startsWith('baseline.')) {
		describe("iife " + file, transform(file, {
			assure_import: /^$/,
			override_import: {
				'../index.js': global.destamd,
			}
		}));
	}
}
