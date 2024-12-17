import { Observer } from 'destam-dom';
import useRipples from '../utils/Ripple';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	switch: {
		display: 'flex',
		alignItems: 'center',
		cursor: 'pointer',
		overflow: 'clip',
		position: 'relative',
		width: '60px',
		height: '30px',
		background: '$color',
		borderRadius: '37.5px',
	},

	switch_hovered: {
		background: '$color_hover'
	},

	switchknob: {
		position: 'absolute',
		width: '23px',
		height: '23px',
		background: '$color_top',
		borderRadius: '50%',
		transition: '100ms',
	},

	switchknob_checked: {
		left: '32.5px',
	},
	switchknob_unchecked: {
		left: '4px',
	}
});

export default ThemeContext.use(h => {
	/**
	 * Switch component.
	 *
	 * This component acts like a toggle switch, utilizing an observable boolean value for its state.
	 * It supports custom styling, event handling, and a disabled state.
	 *
	 * @param {Object} props - The properties object.
	 * @param {Observer<boolean>|boolean} [props.value] - Observable representing the switched state or a static boolean value.
	 * @param {function} [props.onChange] - Function to be executed when the switched state changes.
	 * @param {Observer<boolean>|boolean} [props.disabled] - Observable representing the disabled state or a static boolean value.
	 * @param {Object} [props.style] - Custom styles to apply directly to the switch container.
	 * @param {Object} [props.rest] - Additional props to be propagated to the switch container.
	 *
	 * @returns {JSX.Element} The rendered Switch component.
	 */
	const Switch = ({
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
				"switch",
				type,
				disabled.map(d => d ? 'disabled' : null),
				hover.map(h => h ? 'hovered' : null),
			]}
		>
			<span
				theme={[
					'switchknob',
					value.map(v => v ? 'checked' : 'unchecked'),
					disabled.map(d => d ? 'disabled' : null),
				]}
			/>
			<span draggable="false" theme={[disabled.map(d => d ? 'checkboxOverlay' : null)]} />
			{ripples}
		</Span>;
	};

	return Switch;
});
