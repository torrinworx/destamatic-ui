import { h, mount, Observer, OObject, OArray } from "destam-dom";
import createContext from './Context';
import { sizeProperties } from './h';

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

	focus: {
		extends: ['primary', 'radius'],
		transitionDuration: '0.3s',
		transitionProperty: 'border-color, background-color, box-shadow',
		borderStyle: 'solid',
		borderWidth: .5,
		borderColor: '#388595',
		padding: 10,
		marginTop: 10,
		marginBottom: 10,
		alignItems: 'center',
		background: 'white',
	},

	ripple: {
		background: 'rgba(0, 0, 0, .3)'
	},

	focus_focused: {
		boxShadow: '$color 0 0 0 0.2rem',
		borderColor: '#ced4da',
	},

	focus_error: {
		borderColor: '$color_error',
	},

	drawer: {
		extends: 'secondary',
		outlineColor: '$color',
		outlineWidth: 1,
		outlineStyle: 'solid',
	},

	button: {
		extends: ['primary', 'center', 'radius'],

		height: '40px',
		userSelect: 'none',
		border: 'none',
		cursor: 'pointer',
		textDecoration: 'none',
		position: 'relative',
		overflow: 'clip',
		color: 'black',
		boxShadow: 'none',
	},

	button_text: {
		width: "auto",
	},

	button_contained: {
		color: '$color_top',
		background: '$color',
	},

	button_contained_hovered: {
		background: '$color_hover',
	},

	button_outlined: {
		borderWidth: 2,
		borderStyle: 'solid',
		borderColor: '$color',
	},

	button_outlined_hovered: {
		extends: 'primary_hovered',
		color: 'black',
	},

	hover: {
		backgroundColor: 'rgba(2, 202, 159, 0.1)',
		color: '#02CA9F',
	},

	disabled: {
		cursor: 'default',
		backgroundColor: '#666',
		color: '#CCC',
		pointerEvents: 'none'
	},

	loadingDots: {
		display: 'flex',
		justifyContent: 'center',
		alignItems: 'center',
	},

	loadingDots_dot: {
		extends: 'primary',

		background: '$color',
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        animationName: 'dotFlashing',
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'ease-in-out',
        margin: '20px 4px',
	},

	paper: {
		extends: 'borderRadius',
        background: 'white',
        boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
        insetBoxShadow: 'inset -2px -2px 10px rgba(0,0,0,0.2)',
        padding: 10,
        maxWidth: 'inherit',
        maxHeight: 'inherit',
	},

	checkbox: {
		extends: 'primary',
		padding: 0,
	},

	checkbox_disabled: {
		color: 'black',
	},

	slider: {
		extends: 'primary',

        width: '100%',
        height: '40px',
	},

	slider_track: {
		extends: 'primary_radius',

        background: '$color',
	},

	slider_track_hovered: {
		extends: 'primary',
		background: '$color_hover',
	},

	slider_thumb: {
		$size: 25,
		extends: 'secondary',

        width: `$size$px`,
        height: `$size$px`,
        background: '$color',
	},

	typography_h1: { fontSize: 62 },
	typography_h2: { fontSize: 56 },
	typography_h3: { fontSize: 36 },
	typography_h4: { fontSize: 30 },
	typography_h5: { fontSize: 24 },
	typography_h6: { fontSize: 20 },
	typography_p1: { fontSize: 16 },
	typography_p2: { fontSize: 14 },
	typography_regular: { fontStyle: 'normal' },
	typography_bold: { fontWeight: 'bold' },
	typography_italic: { fontStyle: 'italic' },

	text: {
		extends: 'typography_p1_regular',
        border: 0,
        outline: 0,
        padding: 0,
        background: 'none',
        width: '100%',
	},
});

const Style = ({each: {name, id, body, defines}}) => {
	return Observer.all([
		body,
		Observer.all(defines.map(d => d.vars)),
	]).map(([text, scopes]) => {
		if (!text.length) return null;

		let out = '.' + name + '-' + id + ' {\n';
		for (const item of text) {
			if (typeof item === 'string') {
				out += item;
				continue;
			}

			for (let i = scopes.length - 1; i >= 0; i--) {
				let map = scopes[i];
				if (map.has(item.name)) {
					out += map.get(item.name);
					break;
				}
			}
		}

		out += '\n}\n';

		return out;
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
				const vars = [];
				const text = Object.entries(theme).flatMap(([key, val]) => {
					if (key === 'extends') return '';

					if (key.charAt(0) === '$') {
						vars.push([key.substring(1), val])
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

			current.vars = body.map(({exts, vars}) => Observer.all(exts.map(e => e.vars)).map(scopes => {
				const glob = new Map();

				for (const scope of scopes) {
					for (const [key, val] of scope.entries()) {
						glob.set(key, val);
					}
				}

				for (const [key, val] of vars) {
					glob.set(key, val);
				}

				return glob;
			})).unwrap();

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
						style = {name, id: seq++, defines: defines, body: bodyText};
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
		out.vars = name => themeState.map(({defines}) =>
			Observer.all(defines.map(d => d.vars)).map(scopes => {
			for (let i = scopes.length - 1; i >= 0; i--) {
				const map = scopes[i];
				if (map.has(name)) {
					return map.get(name);
				}
			}
		})).unwrap();
		return out;
	};

	out.theme = theme;
	return out;
};

let theme_seq = 0;
export default createContext(createTheme('daui-', theme), (theme, prev) => {
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
