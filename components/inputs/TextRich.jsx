import { Observer, OArray } from 'destam';

import Theme from '../utils/Theme';
import Shown from '../utils/Shown';
import { Typography } from '../display/Typography';
import ThemeContext from '../utils/ThemeContext';

/*
**still experimental**

TextRich is a fully custom, destamatic-ui, ground up text input component.

My goal in regards to destamatic-ui with building this is to completely replace /inputs/TextArea.jsx and
/inputs/TextField.jsx.

The existing textarea and input with type text browser primities don't offer
enough customization. This component combines the two, while offering the 
same level of customization expected from any destamatic-ui component.

Features:
- area and input modes. Area is equivelant to a <textarea />, while input is equivelant to an <input type='text' />
  area mode is enabled when value is type of OArray/Array. input mode is enabled when value is type string or mutable Observer.
- numbered lines. Disabled by default, line numbers are visible in area mode.
- partial line rendering. Only renders lines that are visible in the ref container. Others slightly outside aren't rendered
  until the user scrolls to them. This prevents lag and keeps the number/indexing processing efficient.
- programming language syntax highlighting. Equivelent to a styled <codeblock /> element. allows you to select a langauge
  that automatically converts the text into different colours.

TODO:
- Add temp history, maybe we don't need network? Just an array with value.effect? for ctrl + z and ctrl + shift + z
- For larger history, cross lines, for something like an ide, let's assume some external
  network thing will work with value somehow.
- Shift + arrow keys == select text, each arrow key press in either direction adds or subtracts from the selection like in a code editor.
- Handle text injection into the selection when selecting a none-text element injected by Typography modifier.
- Make cursor the same height as WrapperRef no matter the element size. it should never match the size of the element.
- Consider what parameters need to be exposed to allow for collaboration, like cursor placement, text value, etc. not to
  implement here, but maybe a small demo would be cool.
- Fix up selection api so that copying text always copies value + atomic elements' textContent. We can ignore non-atomic fragments and
  just use value since with them since their textContent must equal their modifier.
- Ensure that cursor updates position and follows the Typography comp when scrolling events take place.

Info:
if an element in display map is atomic=true, element will be treated as a single item:
- no inner element text selection, no copying of element, or it's text content to the clipboard
- cursor snaps to either side of the single atomic element, inner cursor index placement, through arrows or onMouseUp, will be reconciled to the left or right side of the element.

if an element is atomic = true, or atomic is undefined, the element will be treated as such:
- the original text, from value, that the element is converted to, is copyable and selectable.
- cursor snaps to position within the element, in accordance to the textContent of the node, if textContent != the elements content in value, the element will be treated as atomic

displayMap returns two types of items: atomic, and non-atomic. displayMap is a reconsilor, it helps us determine, modify, and set the cursor position regardless of the elements
condition, normal text, atomic, non-atomic/fragment. This let's us include normal text, atomic elements, 

atomic: atomic elements can be either single characters, simply from normal text. Or they can be an dom elements returned by a text modifier, that wishes to be treated as a single
character.

atomic displayMap entry: {
	index: int, // the start index of the element in Typography value.
	length: int, // the number of characters this element represents, remember this can either be a single character, or an atomic one due to text modifiers. 
	node: <>, // the node reference returned by the Typography modifier.
	displayId, // a unique displayMap entry identifier.
	...props, // other props passed in by modifiers.
};

non-atomic: non atomic elements are dom elements that have been fragmented so that their inner text act as if they were individual text characters in the text field. This allows for
advanced styling while maintaining the functionality of normal text within the textField.

non-atomic displayMap element fragment entry: {
	index: int, // the start index in the Typography value param the whole element starts at.
	node: <>, // the node reference returned by the typography modifier.
	displayId: hash, // a unique identifier, remians the same for all elements of the same non-atomic element.
	atomic: bool, // if false, indicator that this element is a non-atomic element.
	atomicIndex: int, index of this non-atomic element fragment within the string value passed to Typography.
	match: str, // the non-atomic element string the modifier was matched to.
	...props, // other props we can assign in modifiers, (not controlled in TextField).
};

a non atomic element is broken down into multiple entries into displayMap based on the text value it represents
in the text modifier applied to it. The nodes textContent basically.

After the displayMap is updated, we need a function that can take the current position of the cursor within displayMap and convert it into the actual position within the value string.
This can be used to delete and add characters properly within the value string. All goes well this should be a solid system if not a bit messy.
*/

Theme.define({
	textRich: {
		cursor: 'text',
		position: 'relative',
		outline: 'none',
		overflow: 'scroll',
	},
	textRich_typography: {
		extends: 'row',
		whiteSpace: 'pre',
	},
	cursor: { // TODO:  some cool way to invert the colors of the contents beneath the cursor? Like in vscode?
		top: 0,
		width: 4,
		extends: 'radius',
		position: 'absolute',
		background: 'white',
	},
	// TODO: Look into styling and themeing selected text??
});

export default ThemeContext.use(h => {
	const TextRich = ({
		value,
		selection = { start: null, end: null, side: null },
		tabIndex = 0,
		...props
	}, cleanup, mounted) => {
		if (!(selection instanceof Observer)) selection = Observer.mutable(selection);

		const displayMap = OArray([]);
		const cursor = Observer.mutable(null);
		const wrapper = Observer.mutable(null);
		const isFocused = Observer.mutable(false);
		const lastMoved = Observer.mutable(Date.now());
		const timeToFirstBlink = 250; // Time in ms to wait before starting to blink
		const blinkInterval = 400; // Blink phase duration in ms

		const updateCursorPosition = (sel) => {
			lastMoved.set(Date.now());
			const wrapperRect = wrapper.get().getBoundingClientRect();

			if (!sel) return;

			const { end, side } = sel;
			if (!end?.node) return;

			// Find a text node with content == matchText
			const matchNodeText = (root, matchText) => {
				const queue = [root];
				while (queue.length) {
					const current = queue.shift();
					// Check if current is exactly a text node with matching contents
					if (current.nodeType === Node.TEXT_NODE && current.nodeValue === matchText) {
						return current;
					}
					// Otherwise enqueue children
					for (let i = 0; i < current.childNodes.length; i++) {
						queue.push(current.childNodes[i]);
					}
				}
				return null;
			}

			const range = document.createRange();

			// offset is how far into the text we want to place the caret
			// e.g. offset = end.atomicIndex - end.index
			const offset = end.atomicIndex - end.index;

			if (end.atomic === false) {
				const textNode = matchNodeText(end.node, end.match)
					?? end.node.firstChild
					?? end.node;

				if (!textNode) return;

				const textLength = textNode.nodeValue?.length ?? 0;
				const caretOffset = Math.max(0, Math.min(offset, textLength - 1));

				try {
					range.setStart(textNode, caretOffset);
					range.setEnd(textNode, caretOffset + 1);
				} catch (err) {
					range.selectNode(end.node);
				}

				const rect = range.getBoundingClientRect();
				if (!rect) return;

				let left = rect.left - wrapperRect.left;
				if (side === 'right') left = rect.right - wrapperRect.left;

				cursor.get().style.left = `${left}px`;
			} else {// Atomic: measure the bounding box of the entire node
				range.selectNode(end.node);
				const rect = range.getBoundingClientRect();

				let left = rect.left - wrapperRect.left;
				if (side === 'right') {
					left += rect.width;
				}
				cursor.get().style.left = `${left}px`;
			}

			cursor.get().style.height = `${wrapperRect.height}px`;
		};

		const findDisplayNode = (node) => {
			while (node && node !== wrapper.get()) {
				if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('displayId')) {
					return node;
				}
				node = node.parentNode;
			}
			return null;
		};

		const onMouseUp = (e) => {
			const windowSel = window.getSelection();
			if (!windowSel || windowSel.rangeCount === 0) return;

			const anchorNode = findDisplayNode(windowSel.anchorNode);
			const focusNode = findDisplayNode(windowSel.focusNode);

			const getEntry = (id) => displayMap.find(f => f.displayId === id);

			// Get the atomic fragment in displayMap if the element displayId is associated with a non-atomic element.
			const getFragment = (id, offset) => {
				const entry = getEntry(id);
				const textContent = entry.node.textContent;
				const match = entry.match;

				if (textContent !== match) {
					console.error('An atomic element must contain the exact text provided in the text modifier.');
					return entry;
				}

				const entries = displayMap.filter(f => f.displayId === id);
				const matchedEntry = entries.find(f => offset === (f.atomicIndex - f.index));

				if (matchedEntry) return matchedEntry;

				// When offset === match.length, place cursor at right side of last char
				if (offset === match.length) entries.at(-1);

				// fallback for broken offset
				const largest = entries.reduce((max, current) =>
					max.atomicIndex > current.atomicIndex ? max : current, entries[0]);
				return displayMap.find(f => f.index === (largest.atomicIndex + 1));
			};

			let start;
			const startAtomic = anchorNode?.getAttribute('atomic');
			const startId = anchorNode?.getAttribute('displayId');
			if (startAtomic === "false") start = getFragment(startId, windowSel.anchorOffset);
			else start = getEntry(startId);

			let end;
			const endAtomic = focusNode?.getAttribute('atomic');
			const endId = focusNode?.getAttribute('displayId');
			if (endAtomic === "false") end = getFragment(endId, windowSel.focusOffset);
			else end = getEntry(endId);

			let side;
			if (endAtomic === "false") {
				const offset = windowSel.focusOffset;

				// Retrieve matching entry from your getFragment helper
				const entries = displayMap.filter(f => f.displayId === endId);

				const matched = entries.find(f => {
					const start = f.atomicIndex - f.index;
					const end = start + (f.char?.length || 1);
					return offset >= start && offset < end;
				});

				if (!matched) side = 'right';
				else {
					// Decide left/right based on offset within character
					const charStart = matched.atomicIndex - matched.index;
					side = offset <= charStart ? 'left' : 'right';
				}
			} else {
				const rect = end?.node?.getBoundingClientRect();
				console.log(end, rect); // bug: some weird edge case these are undefined for some reason? randomly double clicking text somehow triggers it.
				const mid = rect.left + rect.width / 2;
				side = e.clientX < mid ? 'left' : 'right';
			}

			selection.set({ start, end, side });
		};

		const onFocus = () => isFocused.set(true);
		const onBlur = () => {
			isFocused.set(false);
			selection.set({ start: null, end: null, side: null });
		};

		// really basic, maybe even let user define it:
		const findWordBoundary = (text, index, direction) => {
			let i = index;
			if (direction === 'left') {
				while (i > 0 && text[i - 1] === ' ') i--;
				while (i > 0 && text[i - 1] !== ' ') i--;
			} else if (direction === 'right') {
				while (i < text.length && text[i] === ' ') i++;
				while (i < text.length && text[i] !== ' ') i++;
			}
			return i;
		};

		const onKeyDown = async (e) => {
			if (!isFocused.get()) return;

			const sel = selection.get();

			// TODO: Ctrl + a selection disables default and only selects all text within value.
			const onArrowKey = (direction, sel, displayMap, selection) => {
				const indexAdjustment = direction === 'left' ? -1 : 1;
				const newSide = direction;

				// Remember: index of an item in displayMap is what the cursor should be on
				// not the index within each item, that's the character index it represents
				// from the text value/label.
				const start = displayMap[displayMap.indexOf(sel.end) + indexAdjustment]; // entry in displayMap to apply cursor to.

				if (start) {
					const newSelection = sel.side === newSide ?
						{ start, end: start, side: newSide } :
						{ start: sel.start, end: sel.end, side: newSide };

					// Check if the new selection differs from the current selection
					if (!(newSelection.start === sel.start
						&& newSelection.end === sel.end
						&& newSelection.side === sel.side)) {
						selection.set(newSelection);
					}
				} else {
					const currentSelection = { start: sel.start, end: sel.end, side: newSide };

					// Only update if the current selection has changed
					if (!(currentSelection.start === sel.start
						&& currentSelection.end === sel.end
						&& currentSelection.side === sel.side)) {
						selection.set(currentSelection);
					}
				}
			};

			// Get the proper index range for all selected elements, taking into account non-atomic fragment atomicIndeces.
			const getSelectionRange = () => {
				const sel = selection.get();
				if (!sel || !sel.start || !sel.end) return null;

				/**
				 * Safely gets a numeric field from an entry, falling back to a defaultValue if it's not a number.
				 */
				const numOrDefault = (val, defaultValue) => {
					return typeof val === 'number' && !Number.isNaN(val) ? val : defaultValue;
				};

				/**
				 * Returns the absolute position for a given displayMap entry in the full text/string,
				 * depending on whether it's atomic or not and whether we're interested in the 'left' or
				 * 'right' boundary of the entry.
				 */
				const getAbsoluteIndex = (entry, side) => {
					if (!entry) return 0;

					// For atomic entries, .index is the first character’s position in the full text,
					// and .length is how many characters it represents in the full text.
					if (entry.atomic === true) {
						const atomicStart = numOrDefault(entry.index, 0);
						const atomicLength = numOrDefault(entry.length, 1);
						return side === 'right' ? atomicStart + atomicLength : atomicStart;
					}

					// For non-atomic entries, each fragment is broken out so that:
					//   - entry.index is the starting index of the parent match in the full text.
					//   - entry.atomicIndex is the absolute offset in the overall text for this fragment.
					const parentIndex = numOrDefault(entry.index, 0);
					const fragmentIndex = numOrDefault(entry.atomicIndex, parentIndex);

					// partialOffset is how far into the parent match this fragment is.
					// If side == 'right', we move one extra character.
					const partialOffset = fragmentIndex - parentIndex;
					return parentIndex + partialOffset + (side === 'right' ? 1 : 0);
				};

				// If start and end refer to the same entry, we fall back to the selection's side (or default to 'left').
				// Otherwise, we keep side = 'left' or 'right' for each offset.
				const startSide = sel.start === sel.end ? (sel.side ?? 'left') : 'left';
				const endSide = sel.side ?? 'right';

				const startOffset = getAbsoluteIndex(sel.start, startSide);
				const endOffset = getAbsoluteIndex(sel.end, endSide);

				const rangeStart = Math.min(startOffset, endOffset);
				const rangeEnd = Math.max(startOffset, endOffset);

				return { start: rangeStart, end: rangeEnd };
			};

			switch (e.key) {
				case 'ArrowLeft':
					e.preventDefault()
					onArrowKey('left', sel, displayMap, selection);
					break;
				case 'ArrowRight':
					e.preventDefault()
					onArrowKey('right', sel, displayMap, selection);
					break;
				case 'Backspace':
					// backspace characters, remove chunks with ctrl + Backspace using findWordBoundry
					// use selection, delete all items between and including start->end.
					// within each item there is

					const selectionRange = getSelectionRange();
					console.log(selectionRange.end - selectionRange.start);


					//.slice(selectionRange.end % selectionRange.start, selectionRange.end, 0)

					break;
				case 'Delete':
					// delete characters, remove chunks with ctrl + Backspace using findWordBoundry 
					break;
				case 'Enter':
					break;
				case 'Escape':
					selection.set({ start: null, end: null, side: null });
					break;
				default:
					// add characters to value
					// resolve current selection.end and selection.side to get the index in typography value
					// to inject characters into.
					break;
			}
		};

		const onPaste = (e) => {
			e.preventDefault();
			const pasteText = e.clipboardData.getData('text/plain');
			/*
			something like this but with the new displayMap api:
	
			const curIndx = cursor.get();
			const curValue = value.get();
	
			const newValue = curValue.slice(0, curIndx) + pasteText + curValue.slice(curIndx);
			value.set(newValue);
			cursor.set(curIndx + pasteText.length);
			*/
		};

		cleanup(() => {
			wrapper.get().removeEventListener('mouseup', onMouseUp);
			wrapper.get().removeEventListener('focus', onFocus, true);
			wrapper.get().removeEventListener('blur', onBlur, true);
			wrapper.get().removeEventListener('keydown', onKeyDown);
			wrapper.get().removeEventListener('paste', onPaste);
		});

		mounted(() => {
			wrapper.get().addEventListener('mouseup', onMouseUp);
			wrapper.get().addEventListener('focus', onFocus, true);
			wrapper.get().addEventListener('blur', onBlur, true);
			wrapper.get().addEventListener('keydown', onKeyDown);
			wrapper.get().addEventListener('paste', onPaste);

			cleanup(selection.effect(updateCursorPosition));
			queueMicrotask(updateCursorPosition);
		})

		return <div ref={wrapper} role="textbox" tabindex={tabIndex} {...props} theme='textRich'>
			<Typography theme='textRich' displayMap={displayMap}
				label={value.map(v => Observer.mutable(v === '' ? '\u200B' : v)).unwrap()} />
			<Shown value={selection.map(c => c.end !== null || c.start !== null)}>
				<div ref={cursor} theme='cursor' style={{
					opacity: Observer.timer(blinkInterval).map(() => {
						const delta = Date.now() - lastMoved.get();
						if (delta < timeToFirstBlink) return 1;
						return Math.floor((delta - timeToFirstBlink) / blinkInterval) % 2 === 0 ? 1 : 0
					})
				}} />
			</Shown>
		</div>;
	};
	return TextRich;
});
