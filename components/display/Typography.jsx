import createContext from '../utils/Context';
import ThemeContext from '../utils/ThemeContext';
import Theme from '../utils/Theme';

Theme.define({
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
	typography_inline: { display: 'inline' }
});

export const TextModifiers = createContext(() => null, (value) => {
	return value;
});

export const Typography = ThemeContext.use(h => {
	const applyModifiers = (label, modifiers) => {
		if (!label) return [];

		let result = [];
		let cursor = 0;
		let matches = [];

		// Normalize modifiers to regex
		modifiers.forEach((mod, i) => {
			const pattern = typeof mod.check === 'string'
				? new RegExp(mod.check.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi')
				: mod.check;

			let match;
			while ((match = pattern.exec(label)) !== null) {
				matches.push({
					start: match.index,
					end: match.index + match[0].length,
					match: match[0],
					mod,
					order: i,
				});
			}
		});

		// Sort by start index, then modifier order
		matches.sort((a, b) => a.start - b.start || a.order - b.order);

		// Remove overlaps (prioritize earlier modifiers)
		const filtered = [];
		let lastEnd = 0;
		for (const m of matches) {
			if (m.start >= lastEnd) {
				filtered.push(m);
				lastEnd = m.end;
			}
		}

		for (let i = 0; i <= filtered.length; i++) {
			const prev = filtered[i - 1];
			const next = filtered[i];

			const textBefore = label.slice(cursor, next ? next.start : label.length);
			if (textBefore) {
				result.push(<span key={`text-${cursor}`}>{textBefore}</span>);
			}

			if (next) {
				const rendered = next?.mod?.return?.(next.match);
				if (rendered != null) result.push(rendered);
				cursor = next.end;
			}
		}

		return result;
	};

	return TextModifiers.use(modifiers => ({
		type = 'h1',
		label = '',
		children,
		ref: Ref = <raw:span />,
		...props
	}) => {
		let display = null;

		if (children.length > 0) {
			display = children
		} else if (label) { // modifiers only run on label and if modifiers provided.
			if (modifiers.length > 0) {
				display = label.map(l => applyModifiers(l, modifiers));
			} else {
				display = label;
			}
		}

		console.log(display);

		return <Ref
			{...props}
			theme={['row', 'typography', ...Array.isArray(type) ? type : type.split('_')]}
		>
			{display}
		</Ref>;
	})
});
