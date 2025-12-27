import { Observer } from 'destam-dom';

import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';
import Button from '../Button/Button.jsx';

Theme.define({
	togglethumb: {
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

	togglethumb_unchecked: {
		transform: 'translateX(5px) translateY(-50%) scale(1)',
	},

	togglethumb_checked: {
		transform: 'translateX(32px) translateY(-50%) scale(1)',
	},

	togglethumb_contained: {
		background: '$contrast_text($color_top)',
	},

	togglethumb_contained_disabled: {
		$bg: '$saturate($contrast_text($color_top), -1)',
		background: '$bg',
	},

	togglethumb_outlined: {
		background: '$color',
	},

	togglethumb_outlined_disabled: {
		background: '$saturate($color, -1)',
	},

	togglethumb_outlined_unchecked: {
		transform: 'translateX(3px) translateY(-50%) scale(1)',
	},

	togglethumb_outlined_checked: {
		transform: 'translateX(30px) translateY(-50%) scale(1)',
	},
});

// TODO: Somehow make it clear to the user there is an off/on state with styling? 
// TODO: Type can only be outlined/contained, doesn't make sense to have a "text" theme here.
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

		return <Button
			ref={ref}
			type={type}
			icon={<span
				theme={[
					'togglethumb',
					type,
					value.map(v => v ? 'checked' : 'unchecked'),
					disabled.map(d => d ? 'disabled' : null),
				]}
			/>}
			disabled={disabled}
			hover={hover}
			focused={focused}
			onClick={handleClick}
			role="switch"
			aria-checked={value}
			aria-disabled={disabled}
			style={{
				...style,
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
			}}
			{...props}
		/>;
	};

	return Toggle;
});
