import { h } from './h';
import { Observer } from 'destam-dom';
import useRipples from './Ripple.jsx';
import Theme from './Theme';

Theme.define({
	checkbox: {
		extends: 'primary',
		accentColor: '$color',
	},
});

/**
 * Checkbox component.
 *
 * This component renders a checkbox input that is controlled via an observable state (OValue).
 * It also provides a callback function (onChange) to handle state changes and can receive custom styles.
 *
 * @param {Object} props - The properties object.
 * @param {Observer<boolean>|boolean} [props.value]] - Observable selected state or a boolean value.
 * @param {function} [props.onChange] - Callback function to call when the selected state changes.
 * @param {Object} [props.style] - Custom styles to apply to the component.
 * @param {Object} [props.rest] - Additional props to pass to the input element.
 * 
 * @returns {JSX.Element} The rendered Checkbox component.
 */
const Checkbox = ({ value, onChange, style, ...props }) => {
    if (!(value instanceof Observer)) value = Observer.immutable(value);

	const [ripples, createRipple] = useRipples('rgba(0, 0, 0, 0.3)');
	const hover = Observer.mutable(false);

	const Span = <span />;
	const Input = <input />;

    return <Span
		style={{
			padding: "8px",
			overflow: 'clip',
			position: 'relative',
			borderRadius: '50%',
			background: hover.map(h => h ? 'rgba(0, 0, 0, .1)' : null),
			transition: 'background 250ms',
			display: 'inline-block',
			...style
		}}
		onMouseEnter={() => hover.set(true)}
		onMouseLeave={() => hover.set(false)}
		onClick={e => {
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
				Input.checked = value.get();
			}
		}}
	>
		<Input
			type="checkbox"
			theme="checkbox"
			$checked={value}
			{...props}
		/>
		{ripples}
	</Span>
};

export default Checkbox;
