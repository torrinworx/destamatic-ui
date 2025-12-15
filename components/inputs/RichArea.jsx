import { Observer, OArray } from 'destam';

import Theme from '../utils/Theme.jsx';
import Shown from '../utils/Shown.jsx';
import RichEngine from '../utils/RichEngine.js';
import ThemeContext from '../utils/ThemeContext.jsx';
import { Typography } from '../display/Typography.jsx';

Theme.define({
	richarea: {
		extends: 'field',
		cursor: 'text',
		position: 'relative',
		outline: 'none',
		overflowX: 'auto',
		overflowY: 'auto',
		userSelect: 'text',
		whiteSpace: 'pre',
		overflowWrap: 'normal',
		wordBreak: 'normal',
	},

	richarea_typography: {
		whiteSpace: 'pre',
		display: 'inline-block',
		minHeight: '1.2em',
		userSelect: 'text',
		overflowWrap: 'normal',
		wordBreak: 'normal',
		border: 'none',
	},

	richarea_placeholder: {
		position: 'absolute',
		pointerEvents: 'none',
		opacity: 0.5,
		whiteSpace: 'pre',
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
	const RichArea = Theme.use(themer => ({
		value,
		tabIndex = 0,
		autoFocus = false,
		type = 'p1',
		theme,
		style,
		maxHeight = 200,
		focus = false,
		error = false,
		placeholder = '',
		onKeyDown,
		onEnter,
		blinkInterval = 400,
		timeToFirstBlink = 250,
		...props
	}, cleanup, mounted) => {
		if (!(value instanceof Observer)) value = Observer.mutable(String(value ?? ''));
		if (!(error instanceof Observer)) error = Observer.immutable(error);
		if (!(focus instanceof Observer)) focus = Observer.mutable(!!focus);

		const displayMap = OArray([]);
		const wrapper = Observer.mutable(null);
		const cursor = Observer.mutable(null);
		const measure = Observer.mutable(null);
		const lastMoved = Observer.mutable(Date.now());
		const focusedInternal = Observer.mutable(false);
		const engineRef = Observer.mutable(null);

		// ----- theming (TextArea-style) -----
		const _class = themer(
			theme,
			'richarea',
			type,
			focus.map(f => f ? 'focused' : null),
			error.map(e => e ? 'error' : null),
		);

		// ----- auto height like TextArea -----
		const height = Observer.mutable('auto');

		const recalcHeight = () => {
			const wrap = wrapper.get();
			const m = measure.get();
			if (!wrap || !m) return;

			const cs = getComputedStyle(wrap);
			const padTop = parseFloat(cs.paddingTop) || 0;
			const padBot = parseFloat(cs.paddingBottom) || 0;

			// scrollHeight is what we want (content height, even if clipped)
			let h = (m.scrollHeight || 0) + padTop + padBot + 1;
			if (typeof maxHeight === 'number') h = Math.min(h, maxHeight);

			height.set(h + 'px');
		};

		const scheduleHeight = () => queueMicrotask(recalcHeight);

		// programmatic focus control (like TextArea)
		mounted(() => cleanup(focus.effect(v => {
			const el = wrapper.get();
			if (!el) return;
			if (v) el.focus?.();
			else el.blur?.();
		})));

		// keep focus observer in sync with actual focus state
		const onFocus = () => {
			focusedInternal.set(true);
			focus.set(true);
			lastMoved.set(Date.now());
			engineRef.get()?.updateCursor();
		};
		const onBlur = () => {
			focusedInternal.set(false);
			focus.set(false);
		};

		const onScroll = () => engineRef.get()?.wakeCaret();

		const onMouseUp = (e) => {
			const eng = engineRef.get();
			if (!eng) return;

			wrapper.get().focus();

			const sel = window.getSelection();
			eng.setSelectionFromNativeSelection(sel, e.clientX);
			eng.setCaretFromPoint(e.clientX, e.clientY);
			eng.ensureCaretVisibleSoon();
			eng.updateCursor();
		};

		const handleKeyDown = (e) => {
			// passthrough first
			if (onKeyDown) onKeyDown(e);
			if (e.defaultPrevented) return;

			const eng = engineRef.get();
			if (!eng) return;

			const shift = e.shiftKey;
			const ctrlOrMeta = e.ctrlKey || e.metaKey;
			const key = e.key;

			// read-only: allow nav + copy/select, block edits
			const readOnly = value.isImmutable?.() && value.isImmutable();
			if (readOnly) {
				const allowed =
					key.startsWith('Arrow') ||
					key === 'Home' || key === 'End' ||
					(ctrlOrMeta && (key === 'a' || key === 'A' || key === 'c' || key === 'C'));

				if (!allowed) e.preventDefault();
				return;
			}

			// undo / redo
			if (ctrlOrMeta && (key === 'z' || key === 'Z')) {
				e.preventDefault();
				shift ? eng.redo() : eng.undo();
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

				case 'ArrowUp':
					e.preventDefault();
					eng.moveUp(shift);
					eng.ensureCaretVisibleSoon();
					return;

				case 'ArrowDown':
					e.preventDefault();
					eng.moveDown(shift);
					eng.ensureCaretVisibleSoon();
					return;

				case 'Home':
					e.preventDefault();
					ctrlOrMeta ? eng.moveDocStart(shift) : eng.moveLineStart(shift);
					eng.ensureCaretVisibleSoon();
					return;

				case 'End':
					e.preventDefault();
					ctrlOrMeta ? eng.moveDocEnd(shift) : eng.moveLineEnd(shift);
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
					eng.insertText('\n');
					if (typeof onEnter === 'function') onEnter(value.get(), eng.getSelection());
					eng.ensureCaretVisibleSoon();
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
			if (value.isImmutable?.() && value.isImmutable()) return;

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
			if (value.isImmutable?.() && value.isImmutable()) return;

			const text = eng.getSelectedText();
			if (text == null) return;
			e.preventDefault();
			e.clipboardData?.setData('text/plain', text);
			eng.deleteSelection();
			eng.ensureCaretVisibleSoon();
		};

		cleanup(() => {
			const el = wrapper.get();
			if (!el) return;
			el.removeEventListener('mouseup', onMouseUp);
			el.removeEventListener('keydown', handleKeyDown);
			el.removeEventListener('paste', onPaste);
			el.removeEventListener('copy', onCopy);
			el.removeEventListener('cut', onCut);
			el.removeEventListener('focus', onFocus, true);
			el.removeEventListener('blur', onBlur, true);
			el.removeEventListener('scroll', onScroll);
		});

		mounted(() => {
			const engine = new RichEngine({
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
			el.addEventListener('keydown', handleKeyDown);
			el.addEventListener('paste', onPaste);
			el.addEventListener('copy', onCopy);
			el.addEventListener('cut', onCut);
			el.addEventListener('focus', onFocus, true);
			el.addEventListener('blur', onBlur, true);
			el.addEventListener('scroll', onScroll);

			if (autoFocus) queueMicrotask(() => el?.focus?.());
			queueMicrotask(() => engine.reindex());

			// autosize: recalc after first paint + on value changes
			scheduleHeight();
			cleanup(value.effect(scheduleHeight));
		});

		const blinkOpacity = Observer
			.all([Observer.timer(blinkInterval), lastMoved])
			.map(() => {
				const delta = Date.now() - lastMoved.get();
				if (delta < timeToFirstBlink) return 1;
				return Math.floor((delta - timeToFirstBlink) / blinkInterval) % 2 === 0 ? 1 : 0;
			});

		const showPlaceholder = value.map(v => (String(v ?? '')).length === 0 && placeholder);

		return <div
			ref={wrapper}
			role="textbox"
			aria-multiline="true"
			tabIndex={tabIndex}
			class={_class}
			isFocused={focus}
			style={{
				height,
				maxHeight: typeof maxHeight === 'number' ? `${maxHeight}px` : undefined,
				...style,
			}}
			{...props}
		>
			<Shown value={showPlaceholder}>
				<div class={themer(theme, 'richarea_placeholder', type)}>
					{placeholder}
				</div>
			</Shown>

			<Typography
				ref={measure}
				theme={['richarea_typography']}
				type={type}
				displayMap={displayMap}
				label={value}
			/>

			<Shown value={focusedInternal}>
				<div
					ref={cursor}
					theme="cursor"
					style={{ opacity: blinkOpacity }}
				/>
			</Shown>
		</div>;
	});

	return RichArea;
});
