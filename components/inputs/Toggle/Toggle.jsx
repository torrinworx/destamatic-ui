import { Observer } from 'destam-dom';

import Theme from '../../utils/Theme/Theme.jsx';
import useRipples from '../../utils/Ripple/Ripple.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

Theme.define({
	toggle: {
		display: 'flex',
		alignItems: 'center',
		cursor: 'pointer',
		overflow: 'clip',
		position: 'relative',
		color: '$color',
		width: '60px',
		height: '30px',
		background: '$color',
		borderRadius: '37.5px',
		userSelect: 'none',
	},

	toggleknob: {
		position: 'absolute',
		top: '50%',
		transform: 'translateX(4px) translateY(-50%) scale(1)',
		width: '23px',
		height: '23px',
		background: '$contrast_text($color_top)',
		borderRadius: '50%',

		// TODO: Fix: this transform messes with the border styles of the outlined type, need to narrow the scope of this somehow:
		transition: 'transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1)',
	},

	toggleknob_checked: {
		// Slide the knob to the right.
		transform: 'translateX(32px) translateY(-50%) scale(1)',
	},

	toggleknob_unchecked: {
		// Slide it back to the “left”
		transform: 'translateX(5px) translateY(-50%) scale(1)',
	},

	toggle_contained: {
		background: '$color',
	},

	toggle_contained_hovered: {
		background: '$color_hover',
	},

	toggle_contained_disabled: {
		$bg: '$saturate($color, -1)',
		background: '$bg',
	},

	toggleknob_contained: {
		background: '$contrast_text($color_top)',
	},

	toggleknob_contained_disabled: {
		$bg: '$saturate($contrast_text($color_top), -1)',
		background: '$bg',
	},

	toggle_outlined: {
		background: 'transparent',
		borderWidth: 2,
		borderStyle: 'solid',
	},

	toggle_outlined_hovered: {
		background: 'rgb(0, 0, 0, 0.1)',
	},

	toggle_outlined_disabled: {
		borderColor: '$saturate($color, -1)',
	},

	toggleknob_outlined: {
		background: '$color',
	},

	toggleknob_outlined_disabled: {
		background: '$saturate($color, -1)',
	},

	toggleknob_outlined_checked: {
		transform: 'translateX(30px) translateY(-50%) scale(1)',
	},

	toggleknob_outlined_unchecked: {
		transform: 'translateX(3px) translateY(-50%) scale(1)',
	},

	toggle_hovered: {
		background: '$color_hover',
	},
});

// TODO: Accessiblity: toggle not tabbable for some reason? We aren't using standard <input>, so we have to handle this ourselves properly.
// TODO: Add focusable outline like buttons to toggle.

export default ThemeContext.use(h => {
	/**
	 * toggle component.
	 *
	 * @param {Object} props
	 * @param {Observer<boolean>|boolean} [props.value]
	 * @param {function} [props.onChange]
	 * @param {Observer<boolean>|boolean} [props.disabled]
	 * @param {'contained'|'outlined'|string} [props.type]
	 */
	const Toggle = ({
		value,
		onChange,
		disabled,
		type = 'contained', // default variant
		...props
	}) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(disabled instanceof Observer)) disabled = Observer.immutable(disabled);

		const hover = Observer.mutable(false);
		const [ripples, createRipple] = useRipples();
		const Span = <raw:span />;

		return <Span
			isHovered={hover}
			onMouseDown={e => {
				if (disabled.get()) {
					return;
				}

				createRipple(e);
				const newValue = !value.get();
				value.set(newValue);
				if (onChange) {
					onChange(newValue);
				}
			}}
			{...props}
			theme={[
				'toggle',
				type,
				disabled.map(d => d ? 'disabled' : null),
				hover.map(h => h ? 'hovered' : null),
			]}
		>
			<span
				theme={[
					'toggleknob',
					type,
					value.map(v => v ? 'checked' : 'unchecked'),
					disabled.map(d => d ? 'disabled' : null),
				]}
			/>
			<span draggable="false" theme={[disabled.map(d => d ? 'checkboxOverlay' : null)]} />
			{ripples}
		</Span>;
	};

	return Toggle;
});
