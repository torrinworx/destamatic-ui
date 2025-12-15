import { Observer, OArray } from 'destam';

import Theme from '../utils/Theme.jsx';
import Shown from '../utils/Shown.jsx';
import TextEngine from '../utils/TextEngine.js';
import ThemeContext from '../utils/ThemeContext.jsx';
import { Typography } from '../display/Typography.jsx';

Theme.define({
	richtext: {
		cursor: 'text',
		position: 'relative',
		outline: 'none',
		overflow: 'auto',
		minHeight: '1.2em',
		userSelect: 'text',

	},

	richtext_typography: {
		extends: 'row',
		whiteSpace: 'pre',
		display: 'inline-block',
		minHeight: '1.2em',
		userSelect: 'text',

	},

	cursor: {
		position: 'absolute',
		top: 0,
		left: 0,
		background: '$color_top',
		pointerEvents: 'none',
		transform: 'translateY(0.15em)',
	},
});

export default ThemeContext.use(h => {
	const RichField = ({
		value,
		tabIndex = 0,
		autoFocus = false,
		onEnter,
		type = 'p1',
		...props
	}, cleanup, mounted) => {
		if (!(value instanceof Observer)) value = Observer.mutable(String(value ?? ''));

		const displayMap = OArray([]);
		const wrapper = Observer.mutable(null);
		const cursor = Observer.mutable(null);
		const measure = Observer.mutable(null);
		const lastMoved = Observer.mutable(Date.now());
		const focused = Observer.mutable(false);

		const engineRef = Observer.mutable(null);

		const onMouseUp = (e) => {
			const eng = engineRef.get();
			if (!eng) return;
			wrapper.get()?.focus?.();
			const sel = window.getSelection();
			eng.setSelectionFromNativeSelection(sel, e.clientX);
			eng.ensureCaretVisibleSoon();
			eng.updateCursor();
		};

		const onKeyDown = (e) => {
			const eng = engineRef.get();
			if (!eng) return;

			const shift = e.shiftKey;
			const ctrlOrMeta = e.ctrlKey || e.metaKey;
			const key = e.key;

			// undo / redo
			if (ctrlOrMeta && (key === 'z' || key === 'Z')) {
				e.preventDefault();
				if (shift) eng.redo();
				else eng.undo();
				eng.ensureCaretVisibleSoon();
				return;
			}
			if (ctrlOrMeta && (key === 'y' || key === 'Y')) {
				e.preventDefault();
				eng.redo();
				eng.ensureCaretVisibleSoon();
				return;
			}

			switch (key) {
				case 'ArrowLeft':
					e.preventDefault();
					ctrlOrMeta ? eng.moveWordLeft(shift) : eng.moveLeft(shift);
					eng.ensureCaretVisibleSoon();
					return;

				case 'ArrowRight':
					e.preventDefault();
					ctrlOrMeta ? eng.moveWordRight(shift) : eng.moveRight(shift);
					eng.ensureCaretVisibleSoon();
					return;

				case 'Backspace':
					e.preventDefault();
					ctrlOrMeta ? eng.deleteWordBackward() : eng.deleteBackward();
					eng.ensureCaretVisibleSoon();
					return;

				case 'Delete':
					e.preventDefault();
					ctrlOrMeta ? eng.deleteWordForward() : eng.deleteForward();
					eng.ensureCaretVisibleSoon();
					return;

				case 'Enter':
					e.preventDefault();
					if (typeof onEnter === 'function') {
						onEnter(value.get(), eng.getSelection());
					}
					return;

				case 'a':
				case 'A':
					if (ctrlOrMeta) {
						e.preventDefault();
						eng.selectAll();
						eng.ensureCaretVisibleSoon();
						return;
					}
					break;

				default:
					eng.ensureCaretVisibleSoon();
			}

			// printable chars
			if (key.length === 1 && !ctrlOrMeta) {
				e.preventDefault();
				eng.insertText(key);
				eng.ensureCaretVisibleSoon();
			}
		};

		const onPaste = (e) => {
			const eng = engineRef.get();
			if (!eng) return;
			e.preventDefault();
			const text = e.clipboardData?.getData('text/plain') ?? '';
			if (text) {
				eng.insertText(text);
				eng.ensureCaretVisibleSoon();
			}
		};

		const onCopy = (e) => {
			const eng = engineRef.get();
			if (!eng) return;
			const text = eng.getSelectedText();
			if (text == null) return;
			e.preventDefault();
			e.clipboardData?.setData('text/plain', text);
		};

		const onCut = (e) => {
			const eng = engineRef.get();
			if (!eng) return;
			const text = eng.getSelectedText();
			if (text == null) return;
			e.preventDefault();
			e.clipboardData?.setData('text/plain', text);
			eng.deleteSelection();
			eng.ensureCaretVisibleSoon();
		};

		const onFocus = () => {
			focused.set(true);
			lastMoved.set(Date.now());
			const eng = engineRef.get();
			eng?.updateCursor();
		};

		const onBlur = () => focused.set(false);

		const onScroll = () => {
			const eng = engineRef.get();
			eng?.wakeCaret();
		};

		cleanup(() => {
			const el = wrapper.get();
			if (!el) return;
			el.removeEventListener('mouseup', onMouseUp);
			el.removeEventListener('keydown', onKeyDown);
			el.removeEventListener('paste', onPaste);
			el.removeEventListener('copy', onCopy);
			el.removeEventListener('cut', onCut);
			el.removeEventListener('focus', onFocus, true);
			el.removeEventListener('blur', onBlur, true);
			el.removeEventListener('scroll', onScroll);
		});

		mounted(() => {
			const engine = new TextEngine({
				valueObs: value,
				displayMapObs: displayMap,
				wrapperObs: wrapper,
				cursorElemObs: cursor,
				measureElemObs: measure,
				lastMovedObs: lastMoved,
			});
			engineRef.set(engine);

			const el = wrapper.get();
			el.addEventListener('mouseup', onMouseUp);
			el.addEventListener('keydown', onKeyDown);
			el.addEventListener('paste', onPaste);
			el.addEventListener('copy', onCopy);
			el.addEventListener('cut', onCut);
			el.addEventListener('focus', onFocus, true);
			el.addEventListener('blur', onBlur, true);
			el.addEventListener('scroll', onScroll);

			if (autoFocus) queueMicrotask(() => el?.focus?.());
			queueMicrotask(() => engine.reindex());
		});

		// blink
		const blinkInterval = 400;
		const timeToFirstBlink = 250;

		const blinkOpacity = Observer
			.all([Observer.timer(blinkInterval), lastMoved])
			.map(() => {
				const delta = Date.now() - lastMoved.get();
				if (delta < timeToFirstBlink) return 1;
				return Math.floor((delta - timeToFirstBlink) / blinkInterval) % 2 === 0 ? 1 : 0;
			});

		return <div
			ref={wrapper}
			role="textbox"
			tabIndex={tabIndex}
			{...props}
			theme={['richtext', type]}
		>
			<Typography
				ref={measure}
				theme={['richtext']}
				type={type}
				displayMap={displayMap}
				label={value}
			/>

			<Shown value={focused}>
				<div
					ref={cursor}
					theme='cursor'
					style={{ opacity: blinkOpacity }}
				/>
			</Shown>
		</div>;
	};

	return RichField;
});
