import { h, mount, Observer, OObject, OArray } from "destam-dom";
import createContext from './Context';
import { sizeProperties } from '../util';
import { atomic } from 'destam/Network';

const theme = OObject({
	"*": {
		fontFamily: 'Roboto, sans-serif',
		boxSizing: 'border-box',
	},

	primary: {
		$color: '#02CA9F',
		$color_hover: '#02B891',
		$color_error: 'red',
		$color_top: 'white',
		transition: 'opacity 250ms ease-out, box-shadow 250ms ease-out, background-color 250ms ease-in-out',
	},

	secondary: {
		$color: '#CCCCCC',
		$color_hover: '#AAAAAA',
		$color_error: 'red',
		$color_top: 'white',
		transition: 'opacity 250ms ease-out, box-shadow 250ms ease-out, background-color 250ms ease-in-out',
	},

	border: {
		borderWidth: 2,
		borderStyle: 'solid',
		color: 'inherit',
		background: 'inherit',
	},

	center: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},

	radius: {
		borderRadius: 6,
	},

	ripple: {
		background: 'rgba(0, 0, 0, .3)'
	},

	drawer: {
		extends: 'secondary',
		outlineColor: '$color',
		outlineWidth: 1,
		outlineStyle: 'solid',
	},

	disabled: {
		cursor: 'default',
		backgroundColor: '#666',
		color: '#CCC',
		pointerEvents: 'none'
	},

	focusable: {
		borderStyle: 'solid',
		borderWidth: .5,
		borderColor: '$color',
		transitionDuration: '0.3s',
		transitionProperty: 'border-color, background-color, box-shadow',
	},

	text: {
		extends: 'primary_radius_typography_p1_regular_focusable',
		outline: 0,

		padding: 10,
		alignItems: 'center',
		background: 'white',
	},

	text_area: {
		resize: 'none',
	},

	focused: {
		boxShadow: '$color 0 0 0 0.2rem',
	},

	expand: {
		flexGrow: 1,
		height: '100%',
	}
});

const getVar = (name, exts) => {
	let ret = null;
	for (const node of exts) {
		const current = ret;
		ret = node.body.map(({vars}) => {
			if (vars.has(name)) {
				return vars.get(name);
			}

			if (current === null) console.warn("Theme name is not defined but used: " + name);
			return current;
		}).unwrap();
	}

	return ret;
};

const Style = ({each: {node, name, defines, children}}) => {
	return <>
		{node.body.map(({text}) => {
			if (!text.length) return null;

			return ['.' + name + ' {\n', ...text.map(item => {
				if (typeof item === 'string') return item;

				return getVar(item.name, defines);
			}), '\n}\n'];
		})}
		<Style each={children} />
	</>;
};

const styles = OArray();
// TODO: Find a better way to handle keyframes and css special cases
mount(document.head, <style>
	{`@keyframes dotFlashing {
		0%, 100% { opacity: 0; }
		50% { opacity: 1; }
	}`}
	<Style each={styles} />
</style>);

const getClasses = (trie, classes) => {
	const out = [];
	const current = [...trie];
	for (let ii = 0; ii < classes.length; ii++) {
		const className = classes[ii];

		for (let i = 0; i < current.length; i++) {
			const node = current[i];

			if (node.name !== className) {
				continue;
			}

			if (node.leaf) {
				out.push({node, i: ii});
			}

			current.splice(i, 1, ...node);
			i += node.length - 1;
		}
	}

	out.sort((a, b) => {
		if (a.node.leaf !== b.node.leaf) return a.node.leaf - b.node.leaf;
		return a.i - b.i;
	});

	return out.map(a => a.node);
};

const createTheme = (prefix, theme) => {
	const insertStyle = defines => {
		const found = [];
		const search = (arr, name, index) => {
			if (index >= defines.length) return;

			for (const style of arr) {
				if (style.node === defines[index]) {
					found.push(style.name);
					search(style.children, style.name + '-', index + 1);
					return;
				}
			}

			const style = {
				node: defines[index],
				children: OArray(),
				defines: defines.slice(0, index),
				name: name + defines[index].name.replace(/\*/g, ''),
			};

			search(style.children, style.name + '-', index + 1);
			found.push(style.name);
			arr.push(style);
		};

		search(styles, prefix, 0);
		return found.join(' ');
	};

	const trie = theme.observer.shallow().map(theme => {
		const trie = [];
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

			current.leaf = keys.length;
			current.body = theme.observer.path(key).map(theme => {
				let invariant = true;
				const vars = new Map();
				let text = Object.entries(theme).flatMap(([key, val]) => {
					if (key === 'extends') return '';

					if (key.charAt(0) === '$') {
						vars.set(key.substring(1), val);
						return '';
					}

					if (typeof val === 'number' && sizeProperties.has(key)) {
						val = [val + 'px'];
					} else {
						let out = [];
						val = String(val);

						for (let i = 0; i < val.length; i++) {
							if (val.charAt(i) === '$') {
								let name = '';
								let start = i;
								for (i++; i < val.length; i++) {
									if ("_-0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"
										.indexOf(val.charAt(i)) === -1) break;
									name += val.charAt(i);
								}

								if (val.charAt(i) !== '$') i--;

								if (name === '') {
									out.push('$');
								} else {
									out.push({name});
									invariant = false;
								}
							} else {
								let text = '';
								for (i; i < val.length; i++) {
									if (val.charAt(i) === '$') break;
									text += val.charAt(i);
								}
								out.push(text);
							}
						}

						val = out;
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

					val.splice(0, 0,'\t' + split.join('-') + ": ");
					val.splice(val.length, 0, ';\n');

					return val;
				});

				// resolve any local variables
				text = text.reduce((acc, item) => {
					if (typeof item !== 'string') {
						if (vars.has(item.name)) item = String(vars.get(item.name));
					} else if (!item.length) {
						return acc;
					}

					if (typeof item !== 'string') {
						acc.push(item);
					} else if (typeof acc[acc.length - 1] === 'string') {
						acc[acc.length - 1] += item;
					} else {
						acc.push(item);
					}

					return acc;
				}, []);

				let exts;
				if ('extends' in theme) {
					let ex = theme.extends;
					if (!Array.isArray(ex)) ex = ex.split('_');

					exts = getClasses(trie, ex);
				} else {
					exts = [];
				}

				return {text, vars, invariant, exts};
			}).unwrap();

			current.defs = current.body.map(({exts}) =>
				Observer.all(exts.map(node => node.defs)).map(arr => [...arr.flat(), current])).unwrap();
		};

		return trie;
	});

	const cache = new Map();
	const out = (...classes) =>{
		const defines = Observer.all([trie, ...classes.flat().map(Observer.immutable)]).map(([trie, ...classes]) => {
			classes = classes.flatMap(c => {
				if (c == undefined) return [];
				if (typeof c !== 'string') throw new Error("Theme classes must be a string: " + c);
				return c.split('_');
			});

			let defines = cache.get(classes.join(' '));
			if (defines) return defines;

			defines = Observer.all(getClasses(trie, ["*", ...classes])
				.map(node => node.defs)).map(def => def.flat());

			cache.set(classes.join(' '), defines);
			return defines;
		}).unwrap();

		const out = defines.map(insertStyle);
		out.vars = name => defines.map(defines => getVar(name, defines)).unwrap();
		return out;
	};

	out.theme = theme;
	return out;
};

let theme_seq = 0;
const Theme = createContext(createTheme('daui-', theme), (theme, prev) => {
	prev = prev.theme;

	const out = OObject();

	let keys = new Set([...Object.keys(prev), ...Object.keys(theme)]);
	for (const key of keys) {
		out[key] = theme[key] ?? prev[key];
	}

	const listener = delta => {
		const key = delta.path()[0];
		out[key] = theme[key] ?? prev[key];
	};

	if (theme.observer) theme.observer.shallow().watch(listener);
	if (prev.observer) prev.observer.shallow().watch(listener);

	return createTheme(`daui${theme_seq++}-`, out);
});

Theme.define = obj => atomic(() => {
	for (const o in obj) {
		if (o in theme) throw new Error("Theme.define: theme definition already exists: " + o);
		theme[o] = obj[o];
	}
});

export default Theme;
