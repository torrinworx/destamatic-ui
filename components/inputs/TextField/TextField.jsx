import Observer from 'destam/Observer';

import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

Theme.define({
	field: {
		extends: 'radius_typography_p1_regular',
		outline: 0,
		padding: 10,
		border: 'none',
		color: '$color',
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
		$bg: '$saturate($color, -1)',
		background: '$bg',
		color: '$contrast_text($bg)',
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
		color: '$saturate($color, -1)',
	},

	field_text: {
		extends: 'typography_p1_regular',
	},

	field_text_hovered: {
		background: 'rgb(0, 0, 0, 0.1)',
	},

	field_text_disabled: {
		color: '$saturate($color, -1)',
	},
});

export default ThemeContext.use(h => {
	const TextField = ({
		value,
		type = 'text',
		style,
		inline,
		expand,
		onEnter,
		error,
		focused,
		disabled,
		hover,
		...props
	}, cleanup, mounted) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(error instanceof Observer)) error = Observer.immutable(error);
		if (!(expand instanceof Observer)) expand = Observer.immutable(expand);
		if (!(focused instanceof Observer)) focused = Observer.mutable(focused);
		if (!(hover instanceof Observer)) hover = Observer.mutable(hover);
		if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);


		const ref = Observer.mutable(null);

		mounted(() => cleanup(focused.effect(e => {
			if (e) ref.get().focus();
			else ref.get().blur();
		})));

		if (!focused.isImmutable()) props.isFocused = focused;
		if (!hover.isImmutable()) props.isHovered = hover;

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
			type='text'
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
			isFocused={focused}

			style={{
				display: inline ? 'inline-flex' : 'flex',
				...style
			}}
			disabled={disabled}
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
