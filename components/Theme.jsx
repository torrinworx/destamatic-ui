import { h, mount, Observer, OObject, OArray } from "destam-dom";
import createContext from './Context';
import { sizeProperties } from './h';

const theme = OObject({
	"*": {
		fontFamily: 'Comic sans MS, sans-serif',
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
	return body.map(text => {
		if (!text.length) return null;

		let out = '';
		for (const item of text) {
			if (typeof item === 'string') {
				out += item;
				continue;
			}

			for (let i = defines.length - 1; i >= 0; i--) {
				if (defines[i].vars.has(item.name)) {
					out += defines[i].vars.get(item.name);
					break;
				}
			}
		}

		return ['.' + name + '-' + id + ' {\n', out, '}\n'];
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

const createTheme = (prefix, theme) => {
	const trie = theme.observer.shallow().map(theme => {
		const trie = [];

		const proc = [];

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

				next.depth = current.depth + 1;
				next.name = obj;
				current = next;
			}

			current.leaf = keys.length;

			const name = prefix + key.replace(/\*/g, 'wildcard');
			proc.push({name, node: current, key});
		};

		const resolve = (data) => {
			// already revolved
			if (data.vars) return;

			const {name, node, key} = data;
			const vars = new Map();

			let ex;
			if ('extends' in theme[key]) {
				ex = theme[key].extends;
				if (!Array.isArray(ex)) ex = ex.split('_');
				ex = getClasses(trie, ex);

				for (const e of ex) {
					resolve(proc.find(n => n.node === e));

					for (const [key, val] of e.vars.entries()) {
						vars.set(key, val);
					}
				}
			}

			for (const o in theme[key]) {
				if (o.charAt(0) !== '$') continue;
				vars.set(o.substring(1), theme[key][o]);
			}

			data.ex = ex;
			node.vars = vars;
		}

		// resolve all variable
		for (const data of proc) {
			resolve(data);
		}

		for (const {name, node, key, ex} of proc) {
			const body = theme.observer.path(key).map(style => {
				return Object.entries(style).flatMap(([key, val]) => {
					if (key === 'extends') return '';
					if (key.charAt(0) === '$') return '';

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
					val.invariant = true;

					// resolve any variables we already know
					for (let i = 0; i < val.length; i++) {
						if (typeof val[i] === 'string') continue;
						if (node.vars.has(val[i].name)) {
							val[i] = String(node.vars.get(val[i].name));
							continue;
						}

						val.invariant = false;
					}

					return val;
				});
			});

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

			let seq = 0;
			node.style = defines => {
				let nodes = [];

				let prefix = '';
				if (ex) for (const c of ex) {
					prefix += c.style(defines) + ' ';
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
					style = {name, id: seq++, body, defines: defines.slice(0)};
					styles.splice(anchor, 0, style);
				}

				return prefix + name + '-' + style.id;
			};
		}

		return trie;
	});

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

			let defines = [];

			out = '';
			for (const c of getClasses(trie, ["*", ...classes])) {
				out += ' ' + c.style(defines);

				defines.push(c);
			};

			cache.set(classes.join(' '), {out, defines});
			return {out, defines};
		})

		const out = themeState.map(state => state.out);
		out.vars = name => themeState.map(state => {
			for (let i = state.defines.length - 1; i >= 0; i--) {
				if (state.defines[i].vars.has(name)) {
					return state.defines[i].vars.get(name);
				}
			}
		});
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
