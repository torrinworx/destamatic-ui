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
		width: '60px',
		height: '30px',
		background: '$color',
		borderRadius: '37.5px',
		userSelect: 'none',
	},

	toggle_hovered: {
		background: '$color_hover'
	},

	toggleknob: {
		position: 'absolute',
		top: '50%',
		transform: 'translateX(4px) translateY(-50%) scale(1)',
		width: '23px',
		height: '23px',
		background: '$color_top',
		borderRadius: '50%',
		transition: 'transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1), background-color 150ms ease-in-out',
	},

	toggleknob_checked: {
		// Slide the knob to the right. 
		// 28px or 32px depends on your design—adjust if needed
		transform: 'translateX(32px) translateY(-50%) scale(1)',
	},

	toggleknob_unchecked: {
		// Slide it back to the “left”
		transform: 'translateX(5px) translateY(-50%) scale(1)',
	},
});

// TODO: Accessiblity: toggle not tabbable for some reason? We aren't using standard <input>, so we have to handle this ourselves properly.
// TODO: Add focusable outline like buttons to toggle.

export default ThemeContext.use(h => {
	/**
	 * toggle component.
	 *
	 * This component acts like a toggle toggle, utilizing an observable boolean value for its state.
	 * It supports custom styling, event handling, and a disabled state.
	 *
	 * @param {Object} props - The properties object.
	 * @param {Observer<boolean>|boolean} [props.value] - Observable representing the toggled state or a static boolean value.
	 * @param {function} [props.onChange] - Function to be executed when the toggled state changes.
	 * @param {Observer<boolean>|boolean} [props.disabled] - Observable representing the disabled state or a static boolean value.
	 * @param {Object} [props.style] - Custom styles to apply directly to the toggle container.
	 * @param {Object} [props.rest] - Additional props to be propagated to the toggle container.
	 *
	 * @returns {JSX.Element} The rendered toggle component.
	 */
	const Toggle = ({
		value,
		onChange,
		disabled,
		type,
		...props
	}) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(disabled instanceof Observer)) disabled = Observer.immutable(disabled);

		const hover = Observer.mutable(false);
		const [ripples, createRipple] = useRipples();
		const Span = <raw:span />

		return <Span
			isHovered={hover}
			onMouseDown={e => {
				if (disabled.get()) {
					return;
				}

				try {
					createRipple(e);
					const newValue = !value.get();
					value.set(newValue);
					if (onChange) {
						onChange(newValue);
					}
				} catch (e) {
					throw e;
				}
			}}
			{...props}
			theme={[
				"toggle",
				type,
				disabled.map(d => d ? 'disabled' : null),
				hover.map(h => h ? 'hovered' : null),
			]}
		>
			<span
				theme={[
					'toggleknob',
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
