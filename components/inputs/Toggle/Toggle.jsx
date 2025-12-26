// Toggle.jsx
import { Observer } from 'destam-dom';

import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';
import Button from '../Button/Button.jsx';

Theme.define({
	toggle: {
		position: 'relative',
		alignItems: 'center',
		justifyContent: 'center',
		userSelect: 'none',
		width: 60,
		minWidth: 60,
		height: 30,
		borderRadius: 37.5,
		padding: 0,
		boxSizing: 'border-box',

		flexShrink: 0,
		flexGrow: 0,
	},

	toggleknob: {
		position: 'absolute',
		top: '50%',
		left: 0,
		width: 23,
		height: 23,
		background: '$contrast_text($color_top)',
		borderRadius: '50%',
		transform: 'translateY(-50%) scale(1)',
		transition: 'transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1)',
		pointerEvents: 'none',
		userSelect: 'none',
	},

	toggleknob_unchecked: {
		transform: 'translateX(5px) translateY(-50%) scale(1)',
	},

	toggleknob_checked: {
		transform: 'translateX(32px) translateY(-50%) scale(1)',
	},

	toggleknob_contained: {
		background: '$contrast_text($color_top)',
	},

	toggleknob_contained_disabled: {
		$bg: '$saturate($contrast_text($color_top), -1)',
		background: '$bg',
	},

	toggleknob_outlined: {
		background: '$color',
	},

	toggleknob_outlined_disabled: {
		background: '$saturate($color, -1)',
	},

	toggleknob_outlined_unchecked: {
		transform: 'translateX(3px) translateY(-50%) scale(1)',
	},

	toggleknob_outlined_checked: {
		transform: 'translateX(30px) translateY(-50%) scale(1)',
	},
});

export default ThemeContext.use(h => {
	const Toggle = ({
		value,
		onChange,
		disabled,
		hover,
		focused,
		type = 'contained',
		style,
		onClick,
		ref,
		...props
	}) => {
		if (!(value instanceof Observer)) value = Observer.mutable(!!value);
		if (!(disabled instanceof Observer)) disabled = Observer.mutable(!!disabled);
		if (!(hover instanceof Observer)) hover = Observer.mutable(hover);
		if (!(focused instanceof Observer)) focused = Observer.mutable(focused);

		const handleClick = (event) => {
			if (disabled.get()) return;

			const newValue = !value.get();
			value.set(newValue);

			if (onChange) onChange(newValue, event);
			if (onClick) onClick(event);
		};

		const knob = <span
			theme={[
				'toggleknob',
				type,
				value.map(v => v ? 'checked' : 'unchecked'),
				disabled.map(d => d ? 'disabled' : null),
			]}
		/>;

		// Ensure Button's theme sees both "toggle" and the variant ("contained"/"outlined"/...)
		const buttonType = Array.isArray(type) ? ['toggle', ...type] : ['toggle', type];

		return <Button
			ref={ref}
			type={buttonType}
			icon={knob}
			disabled={disabled}
			hover={hover}
			focused={focused}
			onClick={handleClick}
			role="switch"
			aria-checked={value}
			aria-disabled={disabled}
			style={style}
			{...props}
		/>;
	};

	return Toggle;
});
