import { h } from './h';

import { Observer } from 'destam-dom';
import Theme from './Theme';

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
const Input = Theme.use(theme => ({ value, type='text', placeholder = '', style, ...props }, _, mount) => {
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
        type={type}
        placeholder={placeholder}
        onInput={e => value.set(e.target.value)}
        onFocus={() => isFocused.set(true)}
        onBlur={() => isFocused.set(false)}
        style={{
            minWidth: '100px',
            font: theme.Typography.p1.regular,
            padding: `0px ${theme.padding} 0px ${theme.padding}`,
            height: theme.height,
            border: `${theme.outline} ${theme.Colours.secondary.base}`,
            borderRadius: theme.borderRadius,
            outline: isFocused.map(f =>
                f ? `${theme.outline} ${theme.Colours.primary.base}` : null
            ),
            ...style,
        }}
        {...props}
    />;
});

export default Input;
