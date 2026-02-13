import Observer from 'destam/Observer';

import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

Theme.define({
	field: {
		extends: 'radius',
		outline: 0,
		padding: 10,
		border: 'none',
		color: '$color',
		background: 'none',
	},

	field_contained: {
		extends: 'typography_p1_bold',
		background: '$color',
		color: '$contrast_text($color_top)',
	},

	field_contained_hovered: {
		background: '$color_hover',
	},

	field_contained_disabled: {
		background: '$color_disabled',
		color: '$contrast_text($color_disabled)',
	},

	field_outlined: {
		extends: 'typography_p1_bold',
		borderWidth: 2,
		borderStyle: 'solid',
	},

	field_outlined_hovered: {
		background: 'rgb(0, 0, 0, 0.1)',
	},

	field_outlined_disabled: {
		color: '$color_disabled',
	},

	field_text: {
		extends: 'typography_p1_regular',
	},

	field_text_hovered: {
		background: 'rgb(0, 0, 0, 0.1)',
	},

	field_text_disabled: {
		color: '$color_disabled',
	},
});

export default ThemeContext.use(h => {
	const TextField = ({
		value,
		type = 'contained',
		style,
		inline,
		expand,
		onEnter,
		error,
		focused,
		disabled,
		password,
		hover,
		...props
	}, cleanup, mounted) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(error instanceof Observer)) error = Observer.immutable(error);
		if (!(expand instanceof Observer)) expand = Observer.immutable(expand);
		if (!(password instanceof Observer)) password = Observer.immutable(password);
		if (!(focused instanceof Observer)) focused = Observer.mutable(focused);
		if (!(hover instanceof Observer)) hover = Observer.mutable(hover);
		if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);

		const ref = Observer.mutable(null);

		if (!focused.isImmutable() && !props.isFocused) props.isFocused = focused;
		if (!hover.isImmutable() && !props.isHovered) props.isHovered = hover;

		mounted(() => cleanup(focused.effect(e => {
			if (e) ref.get().focus();
			else ref.get().blur();
		})));

		return <input ref={ref}
			$value={value.def('')}
			onInput={(e) => {
				if (disabled.get()) return;

				if (value.isImmutable()) {
					ref.get().value = value.get() || '';
					return;
				}
				value.set(e.target.value);
			}}
			type={password.bool('password', 'text')}
			onKeyDown={e => {
				if (disabled.get()) return;

				if (value.isImmutable()) {
					e.preventDefault();
				}

				if (e.key === 'Enter') {
					if (onEnter) {
						onEnter(e);
						e.preventDefault();
					}
				}
			}}
			style={{
				display: inline ? 'inline-flex' : 'flex',
				...style,
			}}
			disabled={disabled}
			aria-label={props['aria-label'] ?? props.placeholder}
			{...props}
			theme={[
				'field',
				type,
				focused.map(e => e ? 'focused' : null),
				error.map(e => e ? 'error' : null),
				expand.map(e => e ? 'expand' : null),
				hover.bool('hovered', null),
				disabled.bool('disabled', null),

			]}
		/>;
	};

	return TextField;
});
