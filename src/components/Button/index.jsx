import h from '../h';
import { Observer } from 'destam-dom';

import Shared from '../Shared.jsx';
import useRipples from '../Ripple.jsx';
import Typography from '../Typography.jsx';

/**
 * Button component with ripple effect and dynamic styles based on properties.
 * 
 * @param {Object} props - The properties object.
 * @param {string} [props.label=''] - The text label for the button.
 * @param {string} [props.type='text'] - The type of the button, which affects its style. Can be 'text', 'contained', 'outlined'.
 * @param {Function} [props.onClick] - The function to call when the button is clicked.
 * @param {Function} [props.onMouseDown] - The function to call when the mouse button is pressed down on the button.
 * @param {JSX.Element} [props.Icon] - An optional icon element to display inside the button.
 * @param {Object} [props.style] - Custom styles to apply to the button.
 * @param {Observer<boolean>} [props.disabled] - Observable boolean to determine if the button is disabled.
 * @param {Observer<boolean>} [props.hover] - Observable boolean to determine if the button is in hover state.
 * @param {HTMLElement} [props.Ref] - A reference to the DOM element of the button.
 * @param {...Object} props - Additional properties to spread onto the button element.
 * 
 * @returns {JSX.Element} The rendered button element.
 */
const Button = (
    {
        label = '',
        type = 'text',
        onClick,
        onMouseDown,
        Icon,
        style,
        disabled,
        hover,
        ref: Ref,
        ...props
    }
) => {
    if (!disabled) disabled = Observer.mutable(false);
    if (!hover) hover = Observer.mutable(false);
    if (!Ref) Ref = <div />;
    if (label && typeof label === 'string') {
        label = <Typography style={{ margin: '10px 20px' }} type='p1' fontStyle='bold'>
            {label}
        </Typography>;
    }

    const [ripples, createRipple] = useRipples((() => {
        switch (type) {
            case 'text':
                return Shared.Theme.Colours.ripple.dark;
            case 'contained':
                return Shared.Theme.Colours.ripple.light;
            case 'outlined':
                return Shared.Theme.Colours.ripple.dark;
            default:
                return Shared.Theme.Colours.ripple.dark;
        }
    })());

    const buttonStyle = {
        ...Shared.Theme.Button.base,
        ...Shared.Theme.Button[type].base,
        transition: Shared.Theme.transition,
        borderRadius: Shared.Theme.borderRadius,
        boxShadow: hover.map(h => h ? Shared.Theme.boxShadow : null),
        ...style,
        backgroundColor: disabled.map(d =>
            d ? Shared.Theme.Button[type].disabled.backgroundColor
            || Shared.Theme.Button[type].base.backgroundColor
            : hover.map(h => (h ? Shared.Theme.Button[type].hover.backgroundColor
            : Shared.Theme.Button[type].base.backgroundColor))
        ),
        color: disabled.map(d =>
            d ? Shared.Theme.Button[type].disabled.color
            || Shared.Theme.Button[type].base.color
            : hover.map(h => (h ? Shared.Theme.Button[type].hover.color
                : Shared.Theme.Button[type].base.color))
        ),
        cursor: disabled.map(d =>
            d ? Shared.Theme.Button[type].disabled.cursor
            : Shared.Theme.Button.base.cursor
        ),
        filter: disabled.map(d => (d ? Shared.Theme.Button[type].disabled.filter : 'none')),
        pointerEvents: disabled.map(d =>
            d ? Shared.Theme.Button[type].disabled.pointerEvents : 'auto'
        )
    };

    return <Ref style={style} {...props}>
        <button
            onClick={(event) => {
                if (!disabled.get()) {
                    createRipple(event);
                    onClick && onClick(event);
                }
            }}
            onMouseDown={(event) => {
                if (!disabled.get()) {
                    createRipple(event);
                    onMouseDown && onMouseDown(event);
                }
            }}
            onMouseEnter={() => hover.set(true)}
            onMouseLeave={() => hover.set(false)}
            style={buttonStyle}
            disabled={disabled.map(d => d ? true : false)}
        >
            {Icon ? <i style={Shared.Theme.Button.icon.base}>{Icon}</i> : null}
            {label ? label : null}
            {ripples}
        </button>
    </Ref>;
};

export default Button;
