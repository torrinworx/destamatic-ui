import { h, mount, Observer, OObject, OArray } from "destam-dom";
import createContext from './Context';
import { sizeProperties } from './h';
import { atomic } from 'destam/Network';

const theme = OObject({
	"*": {
		fontFamily: 'Roboto, sans-serif',
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
	},

	border: {
		borderWidth: 2,
		borderStyle: 'solid',
		color: 'inherit',
		background: 'inherit',
	},

	secondary_hovered: {
		color: '#A5A5A5' // Darker variant for secondary
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

	text: {
		extends: 'typography_p1_regular',
        border: 0,
        outline: 0,
        padding: 0,
        background: 'none',
        width: '100%',
	},
});

const getVar = (name, exts, unpack) => {
	let ret;
	for (const node of exts) {
		if (ret) {
			ret = node.vars(name).def(ret);
		} else {
			ret = node.vars(name);
		}
	}

	if (unpack) {
		if (!ret) return null;
		return ret.map(e => e ? String(e.val) : null);
	}

	return ret;
};

const Style = ({each: {name, id, body, defines}}) => {
	return body.map(text => {
		if (!text.length) return null;

		return ['.' + name + '-' + id + ' {\n', ...text.map(item => {
			if (typeof item === 'string') return item;

			return getVar(item.name, defines, true);
		}), '\n}\n'];
	});
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

const compareStyles = (style, name, defines) => {
	if (style.name !== name) return false;
	if (style.defines.length !== defines.length) return false;

	for (let ii = 0; ii < defines.length; ii++) {
		if (style.defines[ii] !== defines[ii]) {
			return false;
		}
	}

	return true;
};

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

			const body = theme.observer.path(key).map(theme => {
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

			current.vars = name => body.map(({exts, vars}) => {
				if (vars.has(name)) {
					return {val: vars.get(name)};
				}

				return getVar(name, exts, false);
			}).unwrap();

			let seq = 0;
			const bodyText = body.map(({text}) => text);
			const name = prefix + key.replace(/\*/g, 'wildcard');
			current.style = _defines => {
				_defines = _defines.slice(0);

				return body.map(({exts, invariant}) => {
					let defines = _defines.slice(0);

					const prefix = Observer.all(exts.map(c => {
						const style = c.style(defines);
						defines.push(c);
						return style;
					}));

					if (invariant) {
						defines = [];
					}

					let anchor = styles.findIndex(style => compareStyles(style, name, defines));
					if (anchor === -1) anchor = styles.length;

					let style;
					for (let i = anchor; i < styles.length; i++) {
						if (compareStyles(styles[i], name, defines)) {
							style = styles[i];
							break;
						}
					}

					if (!style) {
						style = {name, id: seq++, defines, body: bodyText};
						styles.splice(anchor, 0, style);
					}

					return prefix.map(p => [...p, name + '-' + style.id].join(' '));
				}).unwrap();
			};
		};

		return trie;
	});

	const cache = new Map();
	const out = (...classes) =>{
		const themeState = Observer.all([trie, ...classes.map(Observer.immutable)]).map(([trie, ...classes]) => {
			classes = classes.filter(c => {
				if (c == undefined) return false;
				if (typeof c !== 'string') throw new Error("Theme classes must be a string: " + c);
				return true;
			});

			let out = cache.get(classes.join(' '));
			if (out) return out;

			let defines = [], styles = [];
			for (const c of getClasses(trie, ["*", ...classes])) {
				styles.push(c.style(defines));
				defines.push(c);
			};

			out = {out: Observer.all(styles).map(s => s.join(' ')), defines}

			cache.set(classes.join(' '), out);
			return out;
		}).unwrap();

		const out = themeState.map(state => state.out).unwrap();
		out.vars = name => themeState.map(({defines}) => getVar(name, defines, true)).unwrap();
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
