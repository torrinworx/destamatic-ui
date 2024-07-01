import h from './h';

import { Observer } from 'destam-dom';
import Shared from './Shared';

/**
 * Input component primarily for text input with dynamic styling and observable value.
 *
 * Currently, this component is specifically designed for text input elements.
 * TODO: split into separate components for all input tag types: https://www.w3schools.com/tags/tag_input.asp
 * TextInput.jsx
 * DateInput.jsx
 * RadioInput.jsx
 * RangeInput.jsx
 * etc
 *
 * @param {Object} props - The properties object.
 * @param {Observer<string>} props.value - The observable value for the input element.
 * @param {string} [props.type='text'] - The type of input element. Default is 'text'.
 * @param {string} [props.placeholder=''] - The placeholder text for the input element.
 * @param {Object} [props.style] - Custom styles to apply to the input element.
 * @param {boolean} [props.autoFocus=false] - If true, sets focus to the input element when mounted.
 * @param {...Object} [props] - Additional properties to spread onto the input element.
 * @param {Function} mount - The function to handle actions after the component is mounted.
 * 
 * @returns {JSX.Element} The rendered input element.
 */
const Input = ({ value, type='text', placeholder = '', style, ...props }, _, mount) => {
    const isFocused = Observer.mutable(false);

    const Ref = <input />;

    mount(() => {
        if (props.autoFocus) {
            Ref.focus();
            isFocused.set(true);
        }
    });

    return <Ref
        $value={value}
        $type={type}
        $placeholder={placeholder}
        $oninput={e => value.set(e.target.value)}
        $onfocus={() => isFocused.set(true)}
        $onblur={() => isFocused.set(false)}
        $style={{
            minWidth: '100px',
            font: Shared.Theme.Typography.p1.regular,
            padding: `0px ${Shared.Theme.padding} 0px ${Shared.Theme.padding}`,
            height: Shared.Theme.height,
            border: `${Shared.Theme.outline} ${Shared.Theme.colours.secondary.base}`,
            borderRadius: Shared.Theme.borderRadius,
            outline: isFocused.map(f => 
                f ? `${Shared.Theme.outline} ${Shared.Theme.colours.primary.base}` : null
            ),
            ...style,
        }}
        {...props}
    />;
};

export default Input;
