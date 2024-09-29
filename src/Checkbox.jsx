import { h } from './h';
import { Observer } from 'destam-dom';

/**
 * Checkbox component that allows a user to select multiple items from a list of items.
 *
 * @param {Object} props - The properties object.
 * @param {Array<{ label: string, value: string }>} props.items - The list of items to be rendered as checkboxes.
 * @param {Observer<Array<string>>} [props.OValue] - Observable selected values array.
 * @param {function} [props.onChange] - Function to call when the selected values change.
 * @param {Object} [props.style] - Custom styles to apply to the component.
 * 
 * @returns {JSX.Element} The rendered Checkbox component.
 */
const Checkbox = ({ items, OValue=Observer.mutable([]), onChange, style, ...props}) => {
    if (!(OValue instanceof Observer)) OValue = Observer.mutable(OValue);

    const handleSelection = (value) => {
        let newValues;
        if (OValue.get().includes(value)) {
            newValues = OValue.get().filter(val => val !== value);
        } else {
            newValues = [...OValue.get(), value];
        }
        OValue.set(newValues);
        if (onChange) {
            onChange(newValues);
        }
    };

    return <div $style={style} {...props}>
        {items.map(item => (
            <label $style={{ display: 'block', margin: '5px 0' }} key={item.value}>
                <input
                    type="checkbox"
                    checked={item.value}
                    $onchange={() => handleSelection(item.value)}
                />
                {item.label}
            </label>
        ))}
    </div>;
};

export default Checkbox;
