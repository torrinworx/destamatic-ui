import { UUID, Observer } from 'destam';

import Theme from '../utils/Theme';
import createContext from '../utils/Context';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	typography: { whiteSpace: 'pre-wrap' },
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

export const TextModifiers = createContext(() => null, (value) => value);

export const Typography = ThemeContext.use(h => {
	const applyModifiers = (label, modifiers, displayMap) => {
		if (!label) return [];
		if (displayMap.length > 0) displayMap.splice(0, displayMap.length); // Because OArray's don't allow .length = 0

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
			const next = filtered[i];
			const end = next ? next.start : label.length;

			const txt = label.slice(cursor, end);
			if (txt) { // nromal text
				for (let j = 0; j < txt.length; j++) {
					const char = txt[j];
					const displayId = UUID().toHex();
					const span = <raw:span displayId={displayId}>{char}</raw:span>;
					result.push(span);

					displayMap.push({
						index: cursor + j,
						char,
						node: span,
						displayId,
					});
				}
			}

			if (next) { // non-atomic elements
				const { return: _return, check: _check, atomic, ...props } = next.mod;
				const rendered = next?.mod?.return?.(next.match);
				const displayId = UUID().toHex();
				const span = <raw:span displayId={displayId} atomic={`${atomic}`}>{rendered}</raw:span>;

				result.push(span);
				cursor = next.end;

				// treat element as if each character is it's own element.
				if (atomic === false) { // add element to displayMap for each character the cursor is expected to move between.
					const index = next.start;

					let count = 0;
					next.match.split('').forEach(char => {
						displayMap.push({
							// TODO: I think we could get away with only having index and getting rid of atomicIndex. 
							index,
							atomicIndex: index + count,
							node: span.elem_ ? span.elem_ : span,
							match: next.match,
							char,
							displayId,
							atomic,
							...props,
						});
						count++
					});
				} else {
					displayMap.push({
						index: next.start,
						length: next.end - next.start,
						node: span.elem_ ? span.elem_ : span,
						displayId,
						...props,
					});
				}
			} else { // if next is undefined, we have reached the end of the label.
				cursor = label.length;
			}
		}

		return result;
	};

	return TextModifiers.use(modifiers => ({
		type = 'h1',
		label = '',
		displayMap = [],
		children,
		...props
	}) => {
		if (!(label instanceof Observer)) label = Observer.immutable(label);
		let display;

		if (children.length > 0) {
			display = children;
		} else if (modifiers.length > 0) {
			display = label.map(l => applyModifiers(l, modifiers, displayMap));
		} else {
			display = label;
		}

		return <span
			ref
			{...props}
			theme={['typography', type]}
		>
			{display}
		</span>;
	})
});
