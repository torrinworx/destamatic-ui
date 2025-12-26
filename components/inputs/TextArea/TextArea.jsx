// src/components/inputs/TextArea/TextArea.jsx

import Observer from 'destam/Observer';

import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

Theme.define({
	// Extra tweaks on top of TextField's `field` theme
	field_area: {
		resize: 'none',
		overflowY: 'auto',
	},
});

export default ThemeContext.use(h => {
	const TextArea = ({
		value,
		type = 'text',      // 'contained' | 'outlined' | 'text'
		style,
		inline,
		expand,
		onEnter,
		error,
		focused,
		disabled,
		hover,
		maxHeight = 200,    // matches the old textarea default
		onKeyDown,
		...props
	}, cleanup, mounted) => {
		// Normalize props to Observers (same pattern as TextField)
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(error instanceof Observer)) error = Observer.immutable(error);
		if (!(expand instanceof Observer)) expand = Observer.immutable(expand);
		if (!(focused instanceof Observer)) focused = Observer.mutable(focused);
		if (!(hover instanceof Observer)) hover = Observer.mutable(hover);
		if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);
		if (!(maxHeight instanceof Observer)) maxHeight = Observer.immutable(maxHeight);

		const ref = Observer.mutable(null);
		const isMounted = Observer.mutable(false);

		// microtask so layout / fonts settle before first measure
		mounted(() => queueMicrotask(() => isMounted.set(true)));

		// Focus binding
		mounted(() => cleanup(focused.effect(e => {
			const el = ref.get();
			if (!el) return;
			if (e) el.focus();
			else el.blur();
		})));

		// Hook into h’s helpers
		if (!focused.isImmutable()) props.isFocused = focused;
		if (!hover.isImmutable()) props.isHovered = hover;

		return <textarea
			ref={ref}
			rows={1}
			$value={value.def('')}
			onInput={e => {
				if (disabled.get()) return;

				if (value.isImmutable()) {
					const el = ref.get();
					const v = value.get() || '';
					if (el && el.value !== v) el.value = v;
					return;
				}

				value.set(e.target.value);
			}}
			onKeyDown={e => {
				if (disabled.get()) return;

				if (value.isImmutable()) {
					e.preventDefault();
				}

				if (onKeyDown) onKeyDown(e);

				if (e.key === 'Enter' && onEnter) {
					// don’t kill newline by default; let handler decide
					onEnter(e);
				}
			}}
			isFocused={focused}
			style={{
				// this is the important bit: same style as old Textarea,
				// just using the real element + maxHeight Observer
				height: Observer.all([maxHeight, isMounted]).map(([_, mounted]) => {
					if (!mounted) return 'auto';

					return value.map(val => {
						const el = ref.get();
						if (!el) return 'auto';

						// clone real textarea so we inherit all CSS/theme
						const clone = el.cloneNode(true);
						clone.value = val || '';

						clone.style.height = 'auto';
						clone.style.position = 'absolute';
						clone.style.visibility = 'hidden';
						clone.style.pointerEvents = 'none';
						clone.style.top = '0';
						clone.style.left = '-9999px';
						clone.rows = 1;

						document.body.appendChild(clone);
						let h = clone.scrollHeight + 1;
						document.body.removeChild(clone);

						const maxNum = Number.isFinite(+maxHeight.get())
							? +maxHeight.get()
							: null;

						if (maxNum != null && h > maxNum) h = maxNum;

						return h + 'px';
					}).memo();
				}).unwrap(),

				display: inline ? 'inline-flex' : 'flex',
				...style,
			}}
			disabled={disabled}
			{...props}
			theme={[
				'field',
				'area',
				type,
				focused.map(e => e ? 'focused' : null),
				error.map(e => e ? 'error' : null),
				expand.map(e => e ? 'expand' : null),
				hover.bool('hovered', null),
				disabled.bool('disabled', null),
			]}
		/>;
	};

	return TextArea;
});
