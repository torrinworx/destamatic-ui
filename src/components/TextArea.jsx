import { h, Observer } from 'destam-dom';
import Shared from './Shared';

/**
 * Textarea component that provides a flexible and controllable text input area.
 * Automatically resizes based on the content up to a maximum height.
 * 
 * @param {Object} props - The properties object.
 * @param {JSX.Element | string} [props.children] - Children elements to be included inside the textarea.
 * @param {Observer<string>} [props.value] - Observable value for the textarea content.
 * @param {Object} [props.style] - Custom styles to apply to the textarea.
 * @param {number} [props.maxHeight=200] - Maximum height of the textarea before it starts to scroll.
 * @param {string} [props.id] - ID for the textarea element.
 * @param {Function} [props.onKeyDown] - Function to call when a key is pressed down inside the textarea.
 * @param {string} [props.placeholder] - Placeholder text for the textarea.
 * @param {...Object} [props] - Additional properties to spread onto the textarea element.
 * @param {boolean} isMounted - Observer to track if the component is mounted.
 * @param {boolean} isFocused - Observer to track if the textarea is focused.
 * 
 * @returns {JSX.Element} The rendered textarea element.
 */
const Textarea = (
    { 
        children,
        value,
        style,
        maxHeight = 200,
        id,
        onKeyDown,
        placeholder,
        ...props
    },
    _,
    mounted
) => {
    if (!value) value = Observer.mutable('');

    const Ref = <textarea />;
    const isMounted = Observer.mutable(false);
    const isFocused = Observer.mutable(false);
    mounted(() => isMounted.set(true));

    return <Ref
        $id={id}
        $placeholder={placeholder}
        $value={value}
        $onkeydown={onKeyDown}
        $oninput={e => value.set(e.target.value)}
        $onfocus={() => isFocused.set(true)}
        $onblur={() => isFocused.set(false)}
        $style={{
            resize: 'none',
            overflowY: 'auto',
            flexGrow: 1,
            height: Shared.Theme.height,
            padding: Shared.Theme.padding,
            borderRadius: Shared.Theme.borderRadius,
            border: `${Shared.Theme.outline} ${Shared.Theme.colours.secondary.base}`,
            font: Shared.Theme.Typography.p1.regular,
            outline: isFocused.map(f => f ? `${Shared.Theme.outline} ${Shared.Theme.colours.primary.base}` : null),
            height: isMounted.map(mounted => {
                if (!mounted) return 'auto';

                return value.map(val => {
                    let elem = <textarea rows={1} $value={val} $style={{
                        resize: 'none',
                        paddingTop: '0px',
                        paddingBottom: '0px',
                        boxSizing: 'border-box',
                        width: Ref.clientWidth + 'px'
                    }} />;

                    document.body.appendChild(elem);
                    let calculatedHeight = elem.scrollHeight;
                    document.body.removeChild(elem);

                    if (calculatedHeight > maxHeight) {
                        calculatedHeight = maxHeight;
                    }

                    return calculatedHeight + 'px';
                }).memo();
            }).unwrap(),
            ...style
        }}
        {...props}
    />;
};

export default Textarea;
