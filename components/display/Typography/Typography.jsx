import { UUID, Observer } from 'destam';

import Theme from '../../utils/Theme/Theme.jsx';
import createContext from '../../utils/Context/Context.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

Theme.define({
	typography: {
		// line heights
		$lh_body: '1.65',
		$lh_head: '1.15',

		// standard readable line length limit
		$measure: '80ch',

		whiteSpace: 'pre-wrap',
		margin: 0,
		fontWeight: '400',
	},

	typography_h1: {
		extends: 'typography',
		fontSize: 'clamp(2.4rem, 1.8rem + 2.6vw, 3.2rem)',
		lineHeight: '$lh_head',
		fontWeight: '500'
	},

	typography_h2: {
		extends: 'typography',
		fontSize: 'clamp(1.45rem, 1.2rem + 1.1vw, 1.9rem)',
		lineHeight: '$lh_head',
		fontWeight: '500'
	},

	typography_h3: {
		extends: 'typography',
		fontSize: 'clamp(1.25rem, 1.1rem + 0.9vw, 1.6rem)',
		lineHeight: '$lh_head',
		fontWeight: '500',
	},

	typography_h4: {
		extends: 'typography',
		fontSize: 'clamp(1.15rem, 1.05rem + 0.6vw, 1.4rem)',
		lineHeight: '$lh_head',
		fontWeight: '500',
	},

	typography_h5: {
		extends: 'typography',
		fontSize: 'clamp(1.05rem, 1.0rem + 0.45vw, 1.25rem)',
		lineHeight: '$lh_head',
		fontWeight: '500',
	},

	typography_h6: {
		extends: 'typography',
		fontSize: 'clamp(0.98rem, 0.95rem + 0.35vw, 1.15rem)',
		lineHeight: '$lh_head',
		fontWeight: '500',
	},

	typography_p1: {
		extends: 'typography',
		fontSize: 'clamp(1.0rem, 0.95rem + 0.35vw, 1.15rem)',
		lineHeight: '$lh_body',
		maxWidth: '$measure',
		fontWeight: '400',
	},

	typography_p2: {
		extends: 'typography',
		fontSize: 'clamp(0.85rem, 0.8rem + 0.25vw, 0.95rem)',
		lineHeight: '$lh_body',
		maxWidth: '$measure',
		fontWeight: '400',
	},

	typography_regular: { fontStyle: 'normal', fontWeight: '400' },
	typography_bold: { fontWeight: 'bold' },
	typography_italic: { fontStyle: 'italic' },
	typography_center: { textAlign: 'center' },
	typography_inline: { display: 'inline' },

	typography_input: {
		background: 'none',
		outline: 0,
		border: 0,
		padding: 0,
	},
});

export const TextModifiers = createContext(() => null, (value) => value);

export const Typography = ThemeContext.use(h => {
	const applyModifiers = (label, modifiers, displayMap, ctx) => {
		label = label || '';
		const indexMode = !!displayMap;
		if (indexMode && displayMap.length > 0) displayMap.splice(0, displayMap.length);

		let result = [];
		let cursor = 0;
		let matches = [];

		// collect matches
		modifiers.forEach((mod, order) => {
			const pattern = typeof mod.check === 'string'
				? new RegExp(mod.check.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
				: mod.check;

			let m;
			while ((m = pattern.exec(label)) !== null) {
				matches.push({ start: m.index, end: m.index + m[0].length, match: m[0], mod, order });
			}
		});

		// sort and de-overlap
		matches.sort((a, b) => a.start - b.start || a.order - b.order);
		const filtered = [];
		let lastEnd = 0;
		for (const m of matches) {
			if (m.start >= lastEnd) { filtered.push(m); lastEnd = m.end; }
		}

		const makeSpan = (children, attrs) =>
			indexMode ? <span {...attrs}>{children}</span> : <span>{children}</span>;

		for (let i = 0; i <= filtered.length; i++) {
			const next = filtered[i];
			const end = next ? next.start : label.length;

			// gap text
			if (end > cursor) {
				const text = label.slice(cursor, end);

				if (!indexMode) {
					result.push(text);
				} else {
					const displayId = UUID().toHex();
					result.push(makeSpan(text, {
						'data-display-id': displayId,
						'data-kind': 'fragment',
						'data-atomic': 'false',
					}));

					for (let j = 0; j < text.length; j++) {
						const start = cursor + j;
						displayMap.push({
							kind: 'char',
							start,
							end: start + 1,
							displayId,
							atomic: false,
							char: text[j],
						});
					}
				}

				cursor = end;
			}

			// matched range
			if (next) {
				const { return: renderFn, check: _ignored, atomic, ...props } = next.mod;

				const rendered = renderFn?.(next.match, ctx);

				if (!indexMode) {
					result.push(<raw:span>{rendered}</raw:span>);
				} else {
					const displayId = UUID().toHex();
					result.push(makeSpan(rendered, {
						'data-display-id': displayId,
						'data-atomic': String(atomic),
						'data-kind': atomic === false ? 'fragment' : 'atomic',
					}));

					if (atomic === false) {
						for (let k = 0; k < next.match.length; k++) {
							const start = next.start + k;
							displayMap.push({
								kind: 'fragment',
								start,
								end: start + 1,
								displayId,
								atomic: false,
								char: next.match[k],
								...props,
							});
						}
					} else {
						displayMap.push({
							kind: 'atomic',
							start: next.start,
							end: next.end,
							displayId,
							...props,
						});
					}
				}

				cursor = next.end;
			}
		}

		return result;
	};

	const resolveTag = (type) => {
		type = type.get();
		if (!type) return 'span';

		const [first] = type.split('_');
		if (/^h[1-6]$/i.test(first)) return first.toLowerCase();
		if (first === 'p1' || first === 'p2' || first === 'p') return 'p';
		return 'span';
	};

	return TextModifiers.use(modifiers => Theme.use(themer => ({
		type = 'h1',
		label = '',
		displayMap = false,
		children,
		theme,
		...props
	}) => {
		if (!(type instanceof Observer)) type = Observer.immutable(type);

		// context passed to modifiers
		const typographyTheme = ['typography', type];
		const modifierCtx = {
			type,
			theme,
			typographyTheme,
			themer,
		};

		let display;

		if (children.length > 0) {
			display = children;
		} else if (displayMap || modifiers.length > 0) {
			display = label.map(l => applyModifiers(l, modifiers, displayMap || null, modifierCtx));
		} else {
			display = label;
		}

		const TagName = resolveTag(type);

		if (!(display instanceof Observer)) display = Observer.immutable(display);

		if (display.isImmutable()) {
			return <TagName
				ref
				{...props}
				theme={typographyTheme}
			>
				{display}
			</TagName>;
		} else {
			// (unchanged editable branch)
			const editing = Observer.mutable(false);
			const width = Observer.mutable(0);

			const _class = themer(theme, 'typography', type, 'base');

			const Input = (_, __, mounted) => {
				const Ref = <raw:input />;
				mounted(() => {
					Ref.focus();
					Ref.select();
				});

				return <Ref
					theme={['typography', type, 'input']}
					type="text"
					$value={display}
					onInput={e => {
						display.set(e.target.value);

						const elem = <raw:span class={_class.get()} $textContent={e.target.value} />;
						document.body.appendChild(elem);
						width.set(elem.getBoundingClientRect().width);
						document.body.removeChild(elem);
					}}
					onKeyDown={e => {
						if (e.key === 'Enter') editing.set(false);
					}}
					onBlur={() => editing.set(false)}
					style={{ width }}
				/>;
			};

			const ref = Observer.mutable();
			return <TagName
				class={_class}
				ref={ref}
				{...props}
				onClick={() => {
					width.set(ref.get().getBoundingClientRect().width);
					editing.set(true);
				}}
			>
				{editing.bool(<Input />, display).unwrap()}
			</TagName>;
		}
	}))
});
