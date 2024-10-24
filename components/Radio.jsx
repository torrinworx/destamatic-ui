import { h } from './h';
import { Observer } from 'destam-dom';

/**
 * Radio component that allows a user to select one item from a list of items.
 *
 * @param {Object} props - The properties object.
 * @param {Array<{ label: string, value: string }>} props.items - The list of items to be rendered as radio buttons.
 * @param {Observer<string>} [props.OValue] - Observable selected value.
 * @param {function} [props.onChange] - Function to call when the selected value changes.
 * @param {Object} [props.style] - Custom styles to apply to the button.
 * 
 * @returns {JSX.Element} The rendered Radio component.
 */
const Radio = ({ items, OValue=Observer.mutable(''), onChange, style, ...props}) => {
    if (!(OValue instanceof Observer)) OValue = Observer.mutable(OValue);

    const handleSelection = (value) => {
        OValue.set(value);
        if (onChange) {
            onChange(value);
        }
    };

    return <div $style={style}>
        {items.map(item => (
            <label $style={{ display: 'block', margin: '5px 0' }} key={item.value}>
                <input
                    type="radio"
                    checked={OValue.map(val => val === item.value)}
                    $onchange={() => handleSelection(item.value)}
                    {...props}
                />
                {item.label}
            </label>
        ))}
    </div>;
};

export default Radio;
