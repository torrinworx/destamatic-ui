import { h } from './h';
import { Observer } from 'destam-dom';

import Theme from './Theme.jsx';
import useRipples from './Ripple.jsx';
import Typography from './Typography.jsx';

/**
 * Button component with ripple effect and dynamic styles based on properties.
 *
 * @param {Object} props - The properties object.
 * @param {string} [props.label=''] - The text label for the button.
 * @param {string} [props.type='text'] - The type of the button, which affects its style. Can be 'text', 'contained', 'outlined'.
 * @param {Function} [props.onClick] - The function to call when the button is clicked.
 * @param {Function} [props.onMouseDown] - The function to call when the mouse button is pressed down on the button.
 * @param {Function} [props.onMouseUp] - The function to call when the mouse button is released on the button.
 * @param {JSX.Element} [props.Icon] - An optional icon element to display inside the button.
 * @param {Object} [props.style] - Custom styles to apply to the button.
 * @param {Observer<boolean>} [props.disabled] - Observable boolean to determine if the button is disabled.
 * @param {Observer<boolean>} [props.hover] - Observable boolean to determine if the button is in hover state.
 * @param {HTMLElement} [props.Ref] - A reference to the DOM element of the button.
 * @param {...Object} props - Additional properties to spread onto the button element.
 *
 * @returns {JSX.Element} The rendered button element.
 */
const Button = Theme.use(theme => (
    {
        label = '',
        type = 'text',
        onClick,
        inline,
        onMouseDown,
        onMouseUp,
        Icon = null,
        style,
        disabled = Observer.mutable(false),
        hover,
        ref: Ref,
        children,
        ...props
    }
) => {
    if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);
    if (!(hover instanceof Observer)) hover = Observer.mutable(hover);
    if (!Ref) Ref = <button />;
    if (label && typeof label === 'string') {
        label = <Typography type='p1' fontStyle='bold'>
            {label}
        </Typography>;
    }

    const [ripples, createRipple] = useRipples((() => {
        switch (type) {
            case 'text':
                return theme.Colours.ripple.dark;
            case 'contained':
                return theme.Colours.ripple.light;
            case 'outlined':
                return theme.Colours.ripple.dark;
            default:
                return theme.Colours.ripple.dark;
        }
    })());

    const buttonStyle = {
        ...theme.Button.base,
        ...theme.Button[type].base,
        transition: theme.transition,
        borderRadius: theme.borderRadius,
        boxShadow: disabled.map(d =>
            d ? theme.Button[type].disabled.boxShadow
            : theme.Button[type].base.boxShadow || (hover.map(h => h ? theme.boxShadow : null))
        ),
        display: inline ? 'inline-flex' : 'flex',
        backgroundColor: disabled.map(d =>
            d ? theme.Button[type].disabled.backgroundColor
            || theme.Button[type].base.backgroundColor
            : hover.map(h => (h ? theme.Button[type].hover.backgroundColor
            : theme.Button[type].base.backgroundColor))
        ),
        color: disabled.map(d =>
            d ? theme.Button[type].disabled.color
            || theme.Button[type].base.color
            : hover.map(h => (h ? theme.Button[type].hover.color
                : theme.Button[type].base.color))
        ),
        cursor: disabled.map(d =>
            d ? theme.Button[type].disabled.cursor
            : theme.Button.base.cursor
        ),
        filter: disabled.map(d => (d ? theme.Button[type].disabled.filter : 'none')),
        pointerEvents: disabled.map(d =>
            d ? theme.Button[type].disabled.pointerEvents : 'auto'
        ),
        ...style,
    };

    return <Ref
        onClick={(event) => {
            if (!disabled.get() && onClick) {
                createRipple(event);
                onClick(event);
            }
        }}
        onMouseDown={(event) => {
            if (!disabled.get() && onMouseDown) {
                createRipple(event);
                onMouseDown(event);
            }
        }}
		onMouseUp={(event) => {
			if (!disabled.get()) {
				onMouseUp && onMouseUp(event);
			}
		}}
        onMouseEnter={() => hover.set(true)}
        onMouseLeave={() => hover.set(false)}
        style={buttonStyle}
        disabled={disabled.map(d => d ? true : false)}
        {...props}
    >
    	{Icon}
        {label ? label : children}
        {ripples}
    </Ref>
});

export default Button;
