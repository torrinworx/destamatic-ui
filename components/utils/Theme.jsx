import { h, mount, Observer, OObject, OArray } from "destam-dom";
import { atomic } from 'destam/Network';
import { Insert, Delete } from 'destam/Events';

import createContext from './Context';
import { sizeProperties } from '../../util/index.js';
import defaultTheme from '../../util/defaultTheme.js';

const theme = OObject(defaultTheme);

const varWalk = (item, exts) => {
	let ret = null;
	for (let i = 0; i < exts.length; i++) {
		const current = ret;
		ret = exts[i].body.map(({ vars }) => {
			const val = vars.get(item.name);
			if (val && (i < exts.length - 1 || val.index < item.index)) {
				return getVar(val, exts.slice(0, i + 1));
			}

			if (current === null) console.warn("Theme name is not defined but used: " + item.name);
			return current;
		}).unwrap();
	}

	if (item.params) ret = Observer
		.all([ret, ...item.params.map(param => getVar(param, exts))])
		.map(([func, ...params]) => func?.(...params));

	return ret;
};

const getVar = (item, exts) => {
	if (Array.isArray(item)) {
		const items = [];
		const out = [];

		for (let i of item) {
			i = getVar(i, exts);

			if (i instanceof Observer) {
				const index = items.length;
				items.push(i);
				out.push(res => res[index]);
			} else {
				out.push(() => i);
			}
		}

		if (items.length === 0) {
			return Observer.immutable(out.map(p => p()).join(''));
		}

		return Observer.all(items).map(res => out.map(p => p(res)).join(''));
	}

	if (typeof item === 'string') return item;
	if ('value' in item) return item.value;
	if (!item.cache) return varWalk(item, exts);

	let elem = item.cache;
	for (const ext of exts) {
		let next = elem.get(ext);
		if (!next) {
			next = new WeakMap();
			elem.set(ext, next);
		}

		elem = next;
	}

	if (!elem.value) {
		elem.value = varWalk(item, exts);
	}

	return elem.value;
};


const nameItem = Symbol();
const Style = ({ each: { node, name, extras, defines, children } }) => {
	return <>
		{node.body.map(({ text }) => text.map(item => {
			if (item === nameItem) return name;
			return getVar(item, defines);
		}))}
		<Style each={children} />
	</>;
};

const styles = OArray();
// TODO: Find a better way to handle keyframes and css special cases
mount(document.head, <style>
	<Style each={styles} />
</style>);

const getClasses = (trie, classes) => {
	const out = [];
	const map = new Map(trie.map(t => [t.name, [{ node: t }]]));

	for (let ii = 0; ii < classes.length; ii++) {
		const nodes = map.get(classes[ii]);
		if (!nodes) continue;

		map.delete(classes[ii]);

		const iter = [];
		for (const node of nodes) {
			if (node.index == null) node.index = ii;

			if (node.node.body) {
				iter.push(node);
			}

			for (let child of node.node) {
				let existing = map.get(child.name);
				if (!existing) map.set(child.name, existing = []);

				existing.push({ node: child, index: node.index });
			}
		}

		out.push(...iter.sort((a, b) => b.index - a.index).map(a => a.node));
	}

	return out;
};

const ignoreMutates = obs => {
	return Observer(() => obs.get(), v => obs.set(v), (listener, governor) => obs.register_((commit, ...args) => {
		let through = false;
		for (const c of commit) {
			if (c instanceof Insert || c instanceof Delete) {
				through = true;
				break;
			}
		}

		if (!through) return;
		listener(commit, ...args);
	}, governor));
};

const reducer = p => {
	const out = p.reduce((acc, item) => {
		if (typeof item === 'string' && !item.length) {
			return acc;
		}

		if (Array.isArray(item)) {
			acc.push(reducer(item));
		} else if (typeof item !== 'string') {
			if (item.params) item = { ...item, params: item.params.map(reducer) }
			acc.push(item);
		} else if (typeof acc[acc.length - 1] === 'string') {
			acc[acc.length - 1] += item;
		} else if (acc.length !== 0 || item !== ' ') {
			acc.push(item);
		}

		return acc;
	}, []);

	let last = out[out.length - 1];
	if (typeof last === 'string') out[out.length - 1] = last.trimEnd();

	return out;
};

const parse = (val, index) => {
	val = String(val);

	let i = 0;
	const parse = (end, ignore, del) => {
		let out = [];
		const parts = [out];
		let count = 1;
		for (; i < val.length; i++) {
			const char = val.charAt(i);

			if (char === end) {
				count--;
				if (count === 0) break;
			} else if (char === ignore) {
				count++;
			}

			if (count === 1 && char === del) {
				out = [];
				parts.push(out);
			} else if (char === '$') {
				let name = '';
				let start = i;
				for (i++; i < val.length; i++) {
					if ("_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
						.indexOf(val.charAt(i)) === -1) break;
					name += val.charAt(i);
				}

				if (val.charAt(i) !== '$') i--;

				let params;
				if (val.charAt(i + 1) === '(') {
					i += 2;
					params = parse(')', '(', ',');
				}

				if (name === '') {
					out.push('$');
				} else {
					out.push({ name, params, index, cache: new WeakMap() });
				}
			} else {
				out.push(char);
			}
		}

		return parts.map(reducer);
	};

	return parse()[0];
};

const insertStyle = defines => {
	// warn for duplicate styles
	const dup = new Set();
	for (const def of defines) {
		if (dup.has(def)) console.warn("Duplicate theme: " + defines.map(d => d.name).join('_'));
		dup.add(def);
	}

	const found = [];
	const search = (arr, name, index) => {
		if (index >= defines.length) return;

		let i = 0;
		for (const style of arr) {
			if (style.node === defines[index]) {
				found.push(style.name);
				search(style.children, style.name + '-', index + 1);
				return;
			}

			if (style.i === i) i++;
		}

		const style = {
			node: defines[index],
			children: OArray(),
			defines: defines.slice(0, index + 1),
			i,
			name: name + defines[index].name.replace(/\*/g, '') + i,
		};

		search(style.children, style.name + '-', index + 1);
		found.push(style.name);
		arr.splice(i, 0, style);
	};

	search(styles, 'daui', 0);
	return found.join(' ');
};

const buildProperty = (key, val, index) => {
	if (typeof val === 'number' && sizeProperties.has(key)) {
		val = [val + 'px'];
	} else {
		val = parse(val, index);
	}

	const split = [];
	let start = 0;
	for (let i = 0; i < key.length; i++) {
		if (key[i].toLowerCase() !== key[i]) {
			split.push(key.substring(start, i).toLowerCase());
			start = i;
		}
	}

	if (key) split.push(key.substring(start).toLowerCase());

	val.splice(0, 0, '\t' + split.join('-') + ": ");
	val.splice(val.length, 0, ';\n');

	return val;
};

let themeIDCounter = 0;
const createTheme = theme => {
	const themeID = themeIDCounter++;

	const trie = ignoreMutates(theme.observer.shallow(1)).map(theme => {
		const trie = [];
		trie.cache = new Map();

		for (const key of Object.keys(theme)) {
			let current = trie;

			const keys = key.split('_');
			for (let obj of keys) {
				let next;
				for (let node of current) {
					if (node.name === obj) {
						next = node;
						break;
					}
				}

				if (!next) {
					next = [];
					current.push(next);
				}

				next.name = obj;
				current = next;
			}

			current.body = theme.observer.path(key).skip().map(() => {
				const vars = new Map();
				const raw = [];
				const fonts = [];
				let index = 0;

				let text = Object.entries(theme[key]).flatMap(([key, val]) => {
					if (key === 'extends') return '';

					let directive = 'prop';
					if (key.charAt(0) === '_') {
						const del = key.indexOf('_', 1);
						directive = key.substring(1, del);
						key = key.substring(del + 1);
					} else if (key.charAt(0) === '$') {
						directive = 'var';
						key = key.substring(1);
					}

					switch (directive) {
						case 'prop':
							return buildProperty(key, val, index);

						case 'elem':
							raw.push(key, '.', nameItem, ' {\n', ...Object.entries(val).flatMap(([key, val]) => {
								return buildProperty(key, val, index);
							}), '\n}\n');
							break;

						case 'keyframes':
							const name = key + themeID;
							raw.push('@keyframes ', name, '-', key, ' {\n', val, '\n}\n');

							const v = [name, '-' + key];
							v.index = index++;
							vars.set(key, v);
							break;

						case 'var':
							if (typeof val === 'string') {
								val = parse(val, index);
							} else {
								val = { value: val };
							}

							val.index = index++;
							vars.set(key, val);
							break;

						case 'children':
							raw.push('.', nameItem, ' > ', key, ' {\n', ...Object.entries(val).flatMap(([key, val]) => {
								return buildProperty(key, val, index);
							}), '\n}\n');
							break;

						case 'cssProp':
							raw.push('.', nameItem, ':', key, ' {\n', ...Object.entries(val).flatMap(([key, val]) => {
								return buildProperty(key, val, index);
							}), '\n}\n');
							break;

						case 'fontUrl':
							fonts.push("@import url('" + val.url + "');");
							break;

						case 'fontFile':
							// directly load font from font file
							// untested, unlike @import we don't have to append @font-face to the top of the file.
							raw.push(`
								@font-face {
									font-family: '${val.name}';
									src: local('${val.name}'), url('${val.url}') format('${val.format || 'truetype'}');
									font-weight: ${val.weight || 'normal'};
									font-style: ${val.style || 'normal'};
								}
							`);
							break;

						default:
							throw new Error("Unknown theme directive: " + directive);
					}
					return '';
				});

				if (text.length) text = ['.', nameItem, ' {\n', ...text, '\n}\n'];
				text = [...fonts, ...text];
				text.push(...raw);
				text = reducer(text);

				let exts;
				if ('extends' in theme[key]) {
					let ex = theme[key].extends;
					if (!Array.isArray(ex)) ex = ex.split('_');

					exts = getClasses(trie, ex);
				} else {
					exts = [];
				}

				return { text, vars, exts };
			}).unwrap();

			current.defs = current.body.map(({ exts }) =>
				Observer.all(exts.map(node => node.defs)).map(arr => [...arr.flat(), current])).unwrap();
		};

		return Observer.immutable(trie).lifetime(() => () => {
			const i = styles.findIndex(item => trie.includes(item.node));

			if (i >= 0) {
				styles.splice(i, 1);
			}
		});
	}).unwrap();

	const out = (...classes) => {
		const defines = Observer.all([trie, ...classes.flat(Infinity).map(Observer.immutable)]).map(([trie, ...classes]) => {
			classes = classes.flatMap(c => {
				if (c == undefined) return [];
				if (typeof c !== 'string') throw new Error("Theme classes must be a string: " + c);
				return c.split('_');
			});

			let defines = trie.cache.get(classes.join(' '));
			if (defines) return defines;

			defines = Observer.all(getClasses(trie, ["*", ...classes])
				.map(node => node.defs)).map(def => def.flat());

			trie.cache.set(classes.join(' '), defines);
			return defines;
		}).unwrap();

		const out = defines.map(insertStyle);
		out.defines = defines;
		out.vars = (name, ...params) =>
			defines.map(defines => getVar({ name, params: params.length ? params : null, index: Infinity }, defines)).unwrap();
		return out;
	};

	out.theme = theme;
	return out;
};

const Theme = createContext(createTheme(theme), (nextTheme, { theme: prevTheme }) => {
	const zip = (prev, next, prop) => {
		if (prop === 'extends') {
			if (!prev) prev = [];
			if (!next) next = [];

			if (!Array.isArray(prev)) prev = prev.split('_');
			if (!Array.isArray(next)) next = next.split('_');

			if (next[0] === '*') {
				return next.slice(1);
			} else {
				return prev.concat(next);
			}
		} else if (typeof prev === 'object' && typeof next === 'object') {
			const keys = new Set([...Object.keys(next), ...Object.keys(prev)]);

			let out;
			if (prev instanceof OObject || next instanceof OObject) {
				out = OObject();
			} else {
				out = {};
			}

			for (const o of keys) {
				out[o] = zip(prev[o], next[o], o);
			}

			return out;
		} else if (next === undefined) {
			return prev;
		} else {
			return next;
		}
	};

	const update = p => {
		const walk = current => {
			for (let i = 0; i < p.length && current != null; i++) current = current[p[i]];
			return current;
		};

		return zip(walk(prevTheme), walk(nextTheme));
	};

	const out = update([]);
	const listener = delta => {
		const path = delta.path;
		const current = out.observer.path(path);
		current.set(update(path));
	};

	if (nextTheme.observer) nextTheme.observer.watch(listener);
	if (prevTheme.observer) prevTheme.observer.watch(listener);

	return createTheme(out);
});

Theme.define = obj => atomic(() => {
	for (const o in obj) {
		if (o in theme) throw new Error("Theme.define: theme definition already exists: " + o);
		theme[o] = obj[o];
	}
});

Theme.parse = parse;
Theme.getVar = getVar;

export default Theme;
