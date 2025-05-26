import { Observer } from 'destam-dom';

import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';

import useRipples from '../utils/Ripple';
import '../display/Typography';

Theme.define({
	button: {
		extends: 'center_radius',

		padding: 10,
		userSelect: 'none',
		border: 'none',
		cursor: 'pointer',
		textDecoration: 'none',
		position: 'relative',
		overflow: 'clip',
		color: '$color_top',
		boxShadow: 'none',
		background: 'none',

		_cssProp_focus: {
			outline: 'none',
		},
	},

	button_text_hovered: {
		background: 'rgb(0, 0, 0, 0.1)',
	},

	button_contained: {
		extends: 'typography_p1_bold',
		background: '$color',
		color: '$contrast_text($color_top)',
	},

	button_contained_hovered: {
		background: '$color_hover',
	},

	button_outlined: {
		extends: 'typography_p1_bold',

		borderWidth: 2,
		borderStyle: 'solid',
		borderColor: '$color',
		color: '$color',
	},

	button_outlined_hovered: {
		color: '$color_hover',
		borderColor: '$color_hover',
	},

	button_outlined_disabled: {
		borderColor: '$saturate($color, -1)',
		color: '$saturate($color, -1)',
	},

	button_contained_disabled: {
		// temp var
		$bg: '$saturate($color, -1)',
		background: '$bg',
		color: '$contrast_text($bg)',
	},

	text: {
		extends: 'typography_p1_regular',
	},

	button_icon: {
		color: '$color_top',
	},

	button_icon_hovered: {
		color: '$color_hover',
	},
});

export default ThemeContext.use(h => {
	/**
	 * Button component with ripple effect and dynamic styles based on properties.
	 *
	 * @param {Object} props - The properties object.
	 * @param {string} [props.label=''] - The text label for the button.
	 * @param {string} [props.type='text'] - The type of the button, which affects its style. Can be 'text', 'contained', 'outlined'.
	 * @param {Function} [props.onClick] - The function to call when the button is clicked.
	 * @param {Function} [props.onMouseDown] - The function to call when the mouse button is pressed down on the button.
	 * @param {Function} [props.onMouseUp] - The function to call when the mouse button is released on the button.
	 * @param {JSX.Element} [props.icon] - An optional icon element to display inside the button.
	 * @param {Object} [props.style] - Custom styles to apply to the button.
	 * @param {Observer<boolean>} [props.disabled] - Observable boolean to determine if the button is disabled.
	 * @param {Observer<boolean>} [props.hover] - Observable boolean to determine if the button is in hover state.
	 * @param {HTMLElement} [props.Ref] - A reference to the DOM element of the button.
	 * @param {...Object} props - Additional properties to spread onto the button element.
	 *
	 * @returns {JSX.Element} The rendered button element.
	 */
	const Button = ({
		label = '',
		type = 'text',
		onClick,
		inline,
		onMouseDown,
		onMouseUp,
		icon = null,
		Icon = null,
		style,
		disabled,
		hover,
		focused,
		ref: Ref,
		children,
		iconPosition = 'left',
		...props
	}) => {
		if (!icon) icon = Icon;

		if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);
		if (!(focused instanceof Observer)) focused = Observer.mutable(focused);
		if (!(hover instanceof Observer)) hover = Observer.mutable(hover);
		if (!Ref) Ref = <raw:button />;

		disabled = disabled.map(d => !!d);

		const [ripples, createRipple] = useRipples();

		if (!focused.isImmutable()) props.isFocused = focused;
		if (!hover.isImmutable()) props.isHovered = hover;

		return <Ref
			onClick={(event) => {
				if (disabled.get()) return;

				if (onClick) {
					createRipple(event);
					onClick(event);
				}
			}}
			onMouseDown={(event) => {
				if (disabled.get()) return;

				if (onMouseDown) {
					createRipple(event);
					onMouseDown(event);
				}
			}}
			onMouseUp={(event) => {
				if (disabled.get()) return;

				if (onMouseUp) {
					createRipple(event);
					onMouseUp(event);
				}
			}}
			onKeyDown={(event) => {
				if (!disabled.get() && (event.key === "Enter" || event.key === " ")) {
					event.preventDefault();
					createRipple(event);
					if (onClick) onClick(event);
					if (onMouseDown) onMouseDown(event);
				}
			}}
			style={{
				display: inline ? 'inline-flex' : 'flex',
				...style
			}}
			disabled={disabled}
			{...props}
			theme={[
				'button',
				type,
				hover.map(h => h ? 'hovered' : null),
				disabled.map(d => d ? 'disabled' : null),
				focused.map(d => d ? 'focused' : null),
			]}
		>
			{iconPosition === 'left' ? icon : null}
			{label}
			{children}
			{iconPosition === 'right' ? icon : null}
			{ripples}
		</Ref>;
	};

	return Button;
});
