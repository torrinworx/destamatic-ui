import { h } from './h';
import { Observer } from 'destam-dom';

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

    const handleToggle = e => {
        let value = e.target.value === 'on';
        value.set(value);
        if (onChange) {
            onChange(value);
        }
    };

    return <input
        type="checkbox"
        $checked={value}
        onChange={handleToggle}
        style={style}
        {...props}
    />;
};

export default Checkbox;
