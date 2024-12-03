import { h } from './h';
import { Observer } from 'destam-dom';
import useRipples from './Ripple.jsx';
import Theme from './Theme';

Theme.define({
    switchcontainer: {
        extends: 'primary',
        display: 'flex',
        alignItems: 'center',
        cursor: 'pointer',
        overflow: 'clip',
        position: 'relative',
        position: 'relative',
        width: '40px',
        height: '20px',
        background: '$color',
        borderRadius: '25px',
        transition: 'background 300ms',
    },
    switchtrack_disabled: {
        background: '$saturate($color, -1)',
    },
    switchknob: {
        extends: 'primary',
        position: 'absolute',
        width: '18px',
        height: '18px',
        background: '$color_top',
        borderRadius: '50%',
        transition: 'left 300ms',
    },
    switchknob_checked: {
        left: '22px',
    },
    switchknob_unchecked: {
        left: '2px',
    },
    switchknob_disabled: {
        background: '$saturate($color_top, -1)',
    },
});

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
    ...props
}) => {
    if (!(value instanceof Observer)) value = Observer.immutable(value);
    if (!(disabled instanceof Observer)) disabled = Observer.immutable(disabled);

    const [ripples, createRipple] = useRipples();
    const Span = <raw:span />

    return <Span
        theme={[
            "switchcontainer",
            disabled.map(d => d ? 'disabled' : null),
        ]}
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
    >
        <span
            theme={[
                'switchknob',
                value.map(v => v ? 'checked' : 'unchecked'),
                disabled.map(d => d ? 'disabled' : null),
            ]}
        />
        {ripples}
    </Span>;
};

export default Switch;
