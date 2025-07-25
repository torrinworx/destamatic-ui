import { Observer } from 'destam-dom';

import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import useRipples from '../utils/Ripple';

Theme.define({
	checkbox: {
		extends: 'focusable',
		accentColor: '$color',
		height: '20px',
		width: '20px'
	},
	checkboxoverlay: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		backgroundColor: 'rgba(0, 0, 0, 0.2)',
		pointerEvents: 'none',
	},
	checkboxwrapper: {
		display: 'flex',
		flexWrap: 'wrap'
	},
	checkboxspan: {
		padding: "8px",
		overflow: 'clip',
		borderRadius: '50%',
		position: 'relative',
		transition: 'background 250ms',
	},
	checkboxspan_hovered: {
		background: '$color_hover'
	},
});

export default ThemeContext.use(h => {
	/**
	 * Checkbox component.
	 *
	 * This component renders a checkbox input that is managed through an observable value.
	 * It supports a callback function (onChange) to react to state changes and allows for custom styling.
	 * In addition, it can be inverted and disabled based on the specified flags.
	 *
	 * @param {Object} props - The properties object.
	 * @param {Observer<boolean>|boolean} [props.value] - Observable representing the selected state or a static boolean value.
	 * @param {function} [props.onChange] - Function to be executed when the selected state changes.
	 * @param {boolean} [props.invert=false] - Flag to invert the appearance or behavior of the checkbox.
	 * @param {Observer<boolean>|boolean} [props.disabled] - Observable representing the disabled state or a static boolean value.
	 * @param {Object} [props.rest] - Additional props to be propagated to the input element.
	 *
	 * @returns {JSX.Element} The rendered Checkbox component.
	 */
	const Checkbox = ({
		value,
		onChange,
		invert = false,
		disabled,
		...props
	}) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(disabled instanceof Observer)) disabled = Observer.immutable(disabled);

		const [ripples, createRipple] = useRipples();
		const hover = Observer.mutable(false);

		// Disable user able to grab and drag the checkbox:
		return <div theme='checkboxwrapper'>
			<span
				theme={[
					'checkboxspan',
					disabled.map(d => d ? 'disabled' : null),
					hover.map(h => h ? 'hovered' : null),
				]}
				isHovered={hover}
				onMouseDown={e => {
					if (disabled.get() || value.isImmutable()) {
						return;
					}

					try {
						const val = !value.get();
						value.set(val);
						if (onChange) {
							onChange(val);
						}

						createRipple(e);
					} catch (e) {
						throw e;
					} finally {
						// make sure that the chekbox is always in sync with the observer
						Ref.checked = value.get();
					}

					e.preventDefault();
				}}
				draggable="false"
			>
				<input ref
					type="checkbox"
					theme={[
						"checkbox",
						disabled.map(d => d ? 'disabled' : null)
					]}
					$checked={value}
					onClick={e => {
						e.preventDefault();
					}}
					{...props}
				/>
				<span draggable="false" theme={[disabled.map(d => d ? 'checkboxoverlay' : null)]} />
				{ripples}
			</span>
		</div>
	};

	return Checkbox;
});
