import { Observer, OArray } from 'destam';

import Theme from '../utils/Theme';
import Shown from '../utils/Shown';
import { Typography } from '../display/Typography';
import ThemeContext from '../utils/ThemeContext';

/*
New Plan for displayMap: some kind of reconcilor layer that allows us to make easy modifications to value, retreive the current index of the 
cursor from selection in relation to value. This reconcilor system would make implementing the onKeyDown and other functionality much simpler.

it would abstract away handling of atomic/non-atomic fragment elements, left/right side cursor placement index resolution.

Right now working directly with displayMap is cumbersome and would take too long to implement the list of features below with the current implmeentation.
*/


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
- when cursor goes off screen, ensure that we scroll and snapp the view to the location of the cursor so it's always visible.

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
	richtext: {
		cursor: 'text',
		position: 'relative',
		outline: 'none',
		overflow: 'scroll',
	},
	richtext_typography: {
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
	const Text = ({
		value,
		selection = { start: null, end: null, side: null },
		tabIndex = 0,
		...props
	}, cleanup, mounted) => {
		if (!(selection instanceof Observer)) selection = Observer.mutable(selection);

		const blinkInterval = 400; // Blink phase duration in ms
		const timeToFirstBlink = 250; // Time in ms to wait before starting to blink
		const displayMap = OArray([]);
		const cursor = Observer.mutable(null);
		const cursorPos = Observer.mutable(null);
		const wrapper = Observer.mutable(null);
		const lastMoved = Observer.mutable(Date.now());

		// TODO: Possibly simplify updateCursorPosition to use cursorPos instead and just search through displayMap?
		// Update cursor position div within wrapper based on selection updates.
		const updateCursorPosition = () => {
			const sel = selection.get();
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
			};

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

		// Set selection based on user clicks within the wrapper.
		const onMouseUp = (e) => {
			const windowSel = window.getSelection();
			if (!windowSel || windowSel.rangeCount === 0) return;

			const findDisplayNode = (node) => {
				while (node && node !== wrapper.get()) {
					if (node.nodeType === Node.ELEMENT_NODE && node.hasAttribute('displayId')) {
						return node;
					}
					node = node.parentNode;
				}
				return null;
			};

			const anchorNode = findDisplayNode(windowSel.anchorNode);
			// console.log(anchorNode); // bug here with click/selection, anchor node get's updated when the users selection spans multiple atomic/non-atomic/character elements simultaneously.
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

				// if end fragment, select end, lower side selection if/else statement handles side resolution.
				return entries.reduce((max, current) =>
					max.atomicIndex > current.atomicIndex ? max : current, entries[0]);
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
				const mid = rect.left + rect.width / 2;
				side = e.clientX < mid ? 'left' : 'right';
			}

			selection.set({ start, end, side });
		};

		const onKeyDown = async (e) => {
			const sel = selection.get();
			const cur = cursorPos.get();
			const val = value.get();

			const onArrowKey = (direction) => {
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

			const handleDelete = (cur, val, backspace) => {
				if (cur.end > 0) {
					const arr = [...val];
					let newStart, newEnd;

					if (cur.start !== cur.end) { // Delete only the selected range
						const safeStart = Math.max(0, cur.start);
						const safeEnd = Math.min(cur.end, val.length);
						arr.splice(safeStart, safeEnd - safeStart);

						// cursor should end at the beginning of the removed range
						newStart = safeStart;
						newEnd = safeStart;
					} else {
						if (backspace) { // remove the character before the cursor
							const safeStart = Math.max(0, cur.start - 1);
							arr.splice(safeStart, 1);
							newStart = safeStart;
							newEnd = safeStart;
						} else { // remove the character at the cursor
							const safeEnd = Math.min(cur.start, val.length);
							arr.splice(safeEnd, 1);
							newStart = safeEnd;
							newEnd = safeEnd;
						}
					}

					value.set(arr.join(''));
					cursorPos.set({ start: newStart, end: newEnd, side: 'right' });
				}
			};

			switch (e.key) {
				case 'ArrowLeft':
					e.preventDefault();
					onArrowKey('left');
					break;
				case 'ArrowRight':
					e.preventDefault();
					onArrowKey('right');
					break;
				case 'Backspace':
					e.preventDefault();
					handleDelete(cur, val, true);
					break;
				case 'Delete':
					e.preventDefault();
					handleDelete(cur, val, false);
					break;
				case 'Enter':
					// Maybe make onEnter() param?
					break;
				case 'Escape':
					cursorPos.set({ start: null, end: null, side: null });
					break;
				default:
					if (e.key.length !== 1) break;
					e.preventDefault();
					if (cur.start == null || cur.end == null) break;

					const char = e.key;

					const startIndex = Math.min(cur.start, cur.end);
					const endIndex = Math.max(cur.start, cur.end);

					const newVal = val.slice(0, startIndex) + char + val.slice(endIndex);
					value.set(newVal);

					const newCursorPos = startIndex + char.length;
					cursorPos.set({ start: newCursorPos, end: newCursorPos, side: 'right' });

					break;
			};
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

		const onBlur = () => selection.set({ start: null, end: null, side: null });

		cleanup(() => {
			wrapper.get().removeEventListener('mouseup', onMouseUp);
			wrapper.get().removeEventListener('keydown', onKeyDown);
			wrapper.get().removeEventListener('paste', onPaste);
			wrapper.get().removeEventListener('blur', onBlur, true);
		});

		mounted(() => {
			wrapper.get().addEventListener('mouseup', onMouseUp);
			wrapper.get().addEventListener('keydown', onKeyDown);
			wrapper.get().addEventListener('paste', onPaste);
			wrapper.get().addEventListener('blur', onBlur, true);

			cleanup(selection.effect(updateCursorPosition));
			queueMicrotask(updateCursorPosition);
		});

		const setCursorPos = Observer.mutable(false);

		// cursorPos is updated when each selection effect occures and selection is updated.
		cleanup(selection.effect(sel => {
			setCursorPos.set(true);

			const getAbsoluteIndex = (item, side) => {
				// non-atomic fragment
				if (item.atomic === false) {
					// non-atomic fragments, each char has item.atomicIndex
					return side === 'right' ? item.atomicIndex + 1 : item.atomicIndex;
				}
				// atomic
				else {
					// atomic entry with multiple characters, item.length>1
					if (typeof item.length === 'number' && item.length > 1) {
						return side === 'right' ? item.index + item.length : item.index;
					}
					// single-char entry
					return side === 'right' ? item.index + 1 : item.index;
				}
			}

			if (!sel || !sel.start || !sel.end) {
				cursorPos.set({ start: null, end: null, side: null });
				return;
			}

			// If the user clicked (start===end), or used arrows, unify them so anchor=focus.
			if (sel.start === sel.end) {
				const singleIndex = getAbsoluteIndex(sel.start, sel.side);
				setCursorPos.set(true);
				cursorPos.set({ start: singleIndex, end: singleIndex });
				setCursorPos.set(false);
				return;
			}

			// Otherwise do your normal multi‐item selection logic:
			const anchorIndex = getAbsoluteIndex(sel.start, 'left');
			const focusIndex = getAbsoluteIndex(sel.end, sel.side);
			const lower = Math.min(anchorIndex, focusIndex);
			const higher = Math.max(anchorIndex, focusIndex);

			cursorPos.set({ start: lower, end: higher });
			setCursorPos.set(false);
		}));

		/*  
		This snippet is the “inverse” effect so that when you manually set
		cursorPos, the selection is automatically recalculated — i.e. a 
		two-way binding between “selection” and “cursorPos.”
		*/
		cleanup(cursorPos.effect(pos => {
			if (setCursorPos.get()) return;
			// If cursorPos is null, clear the selection.
			if (!pos) {
				selection.set({ start: null, end: null, side: null });
				return;
			}

			// given an index (in the text) find which displayMap item that index maps to, and
			// whether the cursor is on the left or right side of that item.
			const getItemAndSide = (index) => {
				let foundItem = null;
				let side = 'left';
				let minDistance = Infinity;

				displayMap.forEach(item => {
					if (item.atomic === false) {
						// item.atomicIndex is the exact character boundary
						// If index == item.atomicIndex, that’s on the left of that character
						// If index == item.atomicIndex + 1, that’s the right edge, etc.
						const leftEdge = item.atomicIndex;
						const rightEdge = item.atomicIndex + 1;

						// Distances from this index to edges
						const distLeft = Math.abs(index - leftEdge);
						const distRight = Math.abs(index - rightEdge);

						// Snap to whichever edge is closer
						if (distLeft < minDistance) {
							foundItem = item;
							side = 'left';
							minDistance = distLeft;
						}
						if (distRight < minDistance) {
							foundItem = item;
							side = 'right';
							minDistance = distRight;
						}
					} else {
						// For atomic items, item.index..item.index + item.length range
						const startIdx = item.index;
						const endIdx = item.index + (item.length || 1);

						if (index <= startIdx) {
							// Snap to the left edge of the atomic item
							const distance = Math.abs(index - startIdx);
							if (distance < minDistance) {
								foundItem = item;
								side = 'left';
								minDistance = distance;
							}
						} else if (index >= endIdx) {
							// Snap to the right edge
							const distance = Math.abs(index - endIdx);
							if (distance < minDistance) {
								foundItem = item;
								side = 'right';
								minDistance = distance;
							}
						} else {
							// Index is in the middle of an atomic item → clamp to whichever edge is closer
							const distToLeft = Math.abs(index - startIdx);
							const distToRight = Math.abs(index - endIdx);
							if (distToLeft <= distToRight) {
								if (distToLeft < minDistance) {
									foundItem = item;
									side = 'left';
									minDistance = distToLeft;
								}
							} else {
								if (distToRight < minDistance) {
									foundItem = item;
									side = 'right';
									minDistance = distToRight;
								}
							}
						}
					}
				});

				return { item: foundItem, side };
			};

			// Resolve the anchor (pos.start) and focus (pos.end).
			// We’ll call them anchorRes and focusRes just for clarity.
			const anchorRes = getItemAndSide(pos.start);
			const focusRes = getItemAndSide(pos.end);

			// If either is missing, clear the selection or handle gracefully
			if (!anchorRes.item || !focusRes.item) {
				selection.set({ start: null, end: null, side: null });
				return;
			}

			// Decide which item is “start” vs. “end” in the selection. 
			// If you want to preserve backward vs. forward selection, you can
			// see which numeric index is smaller. In this example, we assume 
			// “anchor” is always selection.start, “focus” is selection.end.
			const anchorIndex = pos.start <= pos.end ? pos.start : pos.end;
			const focusIndex = pos.end >= pos.start ? pos.end : pos.start;
			const anchorSide = pos.start <= pos.end ? anchorRes.side : focusRes.side;
			const focusSide = pos.end >= pos.start ? focusRes.side : anchorRes.side;

			// Now update selection. The 'side' we store is the focus side.
			selection.set({
				start: anchorRes.item,
				end: focusRes.item,
				side: focusSide
			});
		}));

		return <div ref={wrapper} role="textbox" tabindex={tabIndex} {...props} theme='richtext'>
			<Typography theme='richtext' displayMap={displayMap}
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
	return Text;
});
