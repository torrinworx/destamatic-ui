import { UUID, Observer } from 'destam';

import Theme from '../utils/Theme';
import createContext from '../utils/Context';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	typography: {
		whiteSpace: 'pre-wrap',
		margin: 0,
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
	const applyModifiers = (label, modifiers, displayMap) => {
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

		// create a span with optional data-* only in index mode
		const makeSpan = (children, attrs) => {
			if (indexMode) {
				return <raw:span {...attrs}>{children}</raw:span>;
			} else {
				// If attrs are only for indexing, omit them for perf
				return <raw:span>{children}</raw:span>;
			}
		};

		for (let i = 0; i <= filtered.length; i++) {
			const next = filtered[i];
			const end = next ? next.start : label.length;

			// gap text (plain text between matches)
			if (end > cursor) {
				const text = label.slice(cursor, end);

				if (!indexMode) {
					// minimal DOM, no indexing
					result.push(text); // or makeSpan(text) if you need a span for styling
				} else {
					const displayId = UUID().toHex();
					const span = makeSpan(text, {
						'data-display-id': displayId,
						'data-kind': 'fragment',
						'data-atomic': 'false',
					});
					result.push(span);

					// push per-char segments referencing this single span
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
				const rendered = renderFn?.(next.match);

				if (!indexMode) {
					const span = <raw:span>{rendered}</raw:span>;
					result.push(span);
				} else {
					const displayId = UUID().toHex();
					const span = makeSpan(rendered, {
						'data-display-id': displayId,
						'data-atomic': String(atomic),
						'data-kind': atomic === false ? 'fragment' : 'atomic',
					});
					result.push(span);

					if (atomic === false) {
						// Always fragment per character for non-atomic
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
						// True atomic – single segment
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

	const rawTags = {
		span: <raw:span />,
		h1: <raw:h1 />,
		h2: <raw:h2 />,
		h3: <raw:h3 />,
		h4: <raw:h4 />,
		h5: <raw:h5 />,
		h6: <raw:h6 />,
		p: <raw:p />,
		input: <raw:input />,
	};

	const resolveTag = (type) => {
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
		let display;

		if (children.length > 0) {
			display = children;
		} else if (displayMap || modifiers.length > 0) {
			display = label.map(l => applyModifiers(l, modifiers, displayMap || null));
		} else {
			display = label;
		}

		const tagName = resolveTag(type);
		const Tag = rawTags[tagName];

		if (!(display instanceof Observer)) display = Observer.immutable(display);

		if (display.isImmutable()) {
			return <Tag
				ref
				{...props}
				theme={['typography', type]}
			>
				{display}
			</Tag>;
		} else {
			const editing = Observer.mutable(false);
			const width = Observer.mutable(0);

			const _class = themer(theme, 'typography', type, 'base');

			const Input = (_, __, mounted) => {
				const Ref = rawTags.input;
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
			return <Tag
				class={_class}
				ref={ref}
				{...props}
				onClick={() => {
					width.set(ref.get().getBoundingClientRect().width);
					editing.set(true);
				}}
			>
				{editing.bool(<Input />, display).unwrap()}
			</Tag>;
		}
	}))
});
