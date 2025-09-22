import { Observer, OArray } from 'destam';

import Theme from '../utils/Theme';
import Shown from '../utils/Shown';
import TextEngine from '../utils/TextEngine';
import ThemeContext from '../utils/ThemeContext';
import { Typography } from '../display/Typography';

Theme.define({
	richtext: {
		cursor: 'text',
		position: 'relative',
		outline: 'none',
		overflow: 'auto',
	},
	richtext_typography: {
		extends: 'row',
		whiteSpace: 'pre',
	},
	cursor: {
		position: 'absolute',
		top: 0,
		width: 4,
		background: '$color_top',
		pointerEvents: 'none',
	},
});

/*
TODO:
- Support cursor being moved while content is scrolling. If the user is scrolling to view text overflowing to the right, the text is moving left, the crusor should also move left in it's relative position to the characters. Right now it sticks to the wrapper.
- ctrl+delete support with word/string groupings similar to vscode, words, things separated by spaces, other parametrs
- on initial click to trigger focus, the cursor is rendered in it's hidden state, not fully visible. Needs to be changed to feel more tactile.
- scale cursor width and hieght to match size of typography element. 
*/

export default ThemeContext.use(h => {
	const Text = ({
		value,
		tabIndex = 0,
		autoFocus = false,
		onEnter,
		type = 'h1',
		...props
	}, cleanup, mounted) => {
		if (!(value instanceof Observer)) value = Observer.mutable(String(value ?? ''));

		const displayMap = OArray([]);
		const wrapper = Observer.mutable(null);
		const cursor = Observer.mutable(null);
		const lastMoved = Observer.mutable(Date.now());
		const focused = Observer.mutable(false);

		// Blink config
		const blinkInterval = 400;
		const timeToFirstBlink = 250;

		// Engine
		const engineRef = Observer.mutable(null);

		// Handlers
		const onMouseUp = (e) => {
			const eng = engineRef.get();
			if (!eng) return;
			wrapper.get()?.focus?.();
			const sel = window.getSelection();
			eng.setSelectionFromNativeSelection(sel, e.clientX);
			eng.ensureCaretVisible();
		};

		const onKeyDown = (e) => {
			const eng = engineRef.get();
			if (!eng) return;

			const shift = e.shiftKey;
			const ctrlOrMeta = e.ctrlKey || e.metaKey;
			const key = e.key;

			switch (key) {
				case 'ArrowLeft':
					e.preventDefault();
					eng.moveLeft(shift);
					eng.ensureCaretVisible();
					return;
				case 'ArrowRight':
					e.preventDefault();
					eng.moveRight(shift);
					eng.ensureCaretVisible();
					return;
				case 'Backspace':
					e.preventDefault();
					eng.deleteBackward();
					eng.ensureCaretVisible();
					return;
				case 'Delete':
					e.preventDefault();
					eng.deleteForward();
					eng.ensureCaretVisible();
					return;
				case 'Enter':
					e.preventDefault();
					if (typeof onEnter === 'function') {
						onEnter(eng.getSelection(), value.get());
					} else {
						eng.insertText('\n');
					}
					eng.ensureCaretVisible();
					return;
				case 'Escape':
					e.preventDefault();
					const { focus } = eng.getSelection();
					eng.setCaret(focus, eng.lastDirection.get());
					return;
				case 'a': case 'A':
					if (ctrlOrMeta) {
						e.preventDefault();
						const len = (value.get() || '').length;
						eng.setSelection(0, len, 'right');
						return;
					}
					break;
				default:
					break;
			}

			// Printable characters
			if (key.length === 1 && !ctrlOrMeta) {
				e.preventDefault();
				eng.insertText(key);
				eng.ensureCaretVisible();
			}
		};

		const onPaste = (e) => {
			const eng = engineRef.get();
			if (!eng) return;
			e.preventDefault();
			const text = e.clipboardData?.getData('text/plain') ?? '';
			if (text) {
				eng.insertText(text);
				eng.ensureCaretVisible();
			}
		};

		const onFocus = () => {
			focused.set(true);
			lastMoved.set(Date.now());
		};

		const onBlur = () => focused.set(false);
		const onScroll = () => {
			const eng = engineRef.get();
			if (!eng) return;
			eng.updateCursor();
		};

		// Lifecycle
		cleanup(() => {
			const el = wrapper.get();
			if (!el) return;
			el.removeEventListener('mouseup', onMouseUp);
			el.removeEventListener('keydown', onKeyDown);
			el.removeEventListener('paste', onPaste);
			el.removeEventListener('focus', onFocus, true);
			el.removeEventListener('blur', onBlur, true);
			el.removeEventListener('scroll', onScroll);
		});

		mounted(() => {
			// Build engine
			const engine = new TextEngine({
				valueObs: value,
				displayMapObs: displayMap,
				wrapperObs: wrapper,
				cursorElemObs: cursor,
				lastMovedObs: lastMoved,
			});
			engineRef.set(engine);

			// Wire DOM events
			const el = wrapper.get();
			el.addEventListener('mouseup', onMouseUp);
			el.addEventListener('keydown', onKeyDown);
			el.addEventListener('paste', onPaste);
			el.addEventListener('focus', onFocus, true);
			el.addEventListener('blur', onBlur, true);
			el.addEventListener('scroll', onScroll);

			if (autoFocus) queueMicrotask(() => el?.focus?.());
			// Force initial index build after first paint
			queueMicrotask(() => engine.reindex());
		});

		// Render
		return <div
			ref={wrapper}
			role="textbox"
			tabIndex={tabIndex}
			{...props}
			theme={['richtext', type]}
		>
			<Typography
				theme={['richtext']}
				type={type}
				displayMap={displayMap}
				label={value}
			/>

			<Shown value={focused}>
				<div
					ref={cursor}
					theme='cursor'
					style={{
						opacity: Observer.timer(blinkInterval).map(() => {
							const delta = Date.now() - lastMoved.get();
							if (delta < timeToFirstBlink) return 1;
							return Math.floor((delta - timeToFirstBlink) / blinkInterval) % 2 === 0 ? 1 : 0;
						})
					}}
				/>
			</Shown>
		</div>;
	};

	return Text;
});
