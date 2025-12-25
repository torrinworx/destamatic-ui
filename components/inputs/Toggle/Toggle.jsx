// Toggle.jsx
import { Observer } from 'destam-dom';

import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';
import Button from '../Button/Button.jsx';

Theme.define({
	toggleknob: {
		position: 'absolute',
		top: '50%',
		left: 0, // anchor to the left edge of the button
		width: 23,
		height: 23,
		background: '$contrast_text($color_top)',
		borderRadius: '50%',

		// Only vertical centering here; no X shift in the base
		transform: 'translateY(-50%) scale(1)',
		transition: 'transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1)',
		pointerEvents: 'none',
	},

	// CONTAINED positions
	// Unchecked = left
	toggleknob_unchecked: {
		transform: 'translateX(5px) translateY(-50%) scale(1)',
	},

	// Checked = right
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

	// OUTLINED variant (slightly different offsets to account for border)
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
	/**
	 * Toggle built on top of Button.
	 *
	 * Extra API over Button:
	 *   - value: boolean | Observer<boolean>
	 *   - onChange: (newValue: boolean, event) => void
	 */
	const Toggle = ({
		value,
		onChange,
		disabled,
		hover,
		focused,
		type = 'contained',        // 'contained' | 'outlined' | etc, same as Button
		label = '',                 // optional, usually empty for a pure switch
		iconPosition = 'left',      // not super important, knob is absolute
		inline,
		style,
		onClick,                    // optional, called after onChange
		loading = false,            // toggles usually don't want LoadingDots
		ref,                        // allow passing an Observer ref like TextField
		...props                    // pass through rest of Button props (aria-*, tabIndex, etc)
	}, cleanup, mounted) => {
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

		return <Button
			ref={ref}
			type={type}
			label={label}
			icon={knob}
			iconPosition={iconPosition}
			inline={inline}
			disabled={disabled}
			hover={hover}
			focused={focused}
			loading={loading}
			onClick={handleClick}
			role="switch"
			aria-checked={value}
			aria-disabled={disabled}

			style={{
				position: 'relative',
				display: inline ? 'inline-flex' : 'flex',
				alignItems: 'center',
				justifyContent: 'center',
				width: 60,
				minWidth: 60,
				height: 30,
				borderRadius: 37.5,
				padding: 0,
				boxSizing: 'border-box',
				flexShrink: 0,
				flexGrow: 0,
				...style,
			}}

			{...props}
		/>;
	};

	return Toggle;
});
