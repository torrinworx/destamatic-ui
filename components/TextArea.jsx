import { Observer, h as destam_h } from 'destam-dom';
import { h } from './h';
import Theme from './Theme';
import FocusEffect from './FocusEffect';

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
const Textarea = Theme.use(theme => (
    {
        children,
        value,
        style,
        maxHeight = 200,
        id,
        onKeyDown,
        placeholder = '',
        ...props
    },
    _,
    mounted
) => {
    if (!(value instanceof Observer)) value = Observer.immutable(value);

    const Ref = <textarea />;
    const isMounted = Observer.mutable(false);
    const isFocused = Observer.mutable(false);
    mounted(() => isMounted.set(true));

    const _class = theme('text', 'area');

    return <FocusEffect
        enabled={isFocused.map(focus => focus && !value.isImmutable())}
        style={{
            padding: '10px',
            pointer: 'text',
        }}
        onMouseDown={e => {
            if (e.target !== Ref) {
            	Ref.focus();
                e.preventDefault();
            }
        }}
    >
         <Ref
            id={id}
            placeholder={placeholder}
            $value={value}
            onKeyDown={onKeyDown}
            onInput={e => {
                if (value.isImmutable()) {
                    Ref.value = value.get() || '';
                    return;
                }

                value.set(e.target.value);
            }}
			isFocused={isFocused}
            class={_class}
            style={{
                display: 'block',
                resize: 'none',
                overflowY: 'auto',
                flexGrow: 1,
                height: isMounted.map(mounted => {
                    if (!mounted) return 'auto';

                    return value.map(val => {
                        let elem = <destam_h:textarea class={_class.get()} rows={1} $value={val} $style={{
                            resize: 'none',
                            padding: '0px',
                            boxSizing: 'border-box',
                            width: Ref.clientWidth + 'px',
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
        />
    </FocusEffect>;
});

export default Textarea;
