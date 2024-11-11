import { h } from './h';
import { Observer } from 'destam-dom';

import Theme from './Theme.jsx';
import useRipples from './Ripple.jsx';
import Typography from './Typography.jsx';

Theme.define({
    button: {
        extends: ['primary', 'center', 'radius'],

        padding: 10,
        userSelect: 'none',
        border: 'none',
        cursor: 'pointer',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'clip',
        color: '$color_text',
        boxShadow: 'none',
        background: 'none',
    },

    button_text: {
        border: 0,
    },

    button_text_hovered: {
        background: 'rgb(0, 0, 0, 0.1)',
    },

    button_contained: {
        color: '$color_top',
        background: '$color',
    },

    button_contained_hovered: {
        background: '$color_hover',
    },

    button_outlined: {
        borderWidth: 2,
        borderStyle: 'solid',
        borderColor: '$color',
        color: '$color',
    },

    button_outlined_hovered: {
        color: '$color_hover',
        borderColor: '$color_hover',
    },

    text: {
        extends: 'typography_p1_regular',
    },
});

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
const Button = ({
    label = '',
    type = 'text',
    onClick,
    inline,
    onMouseDown,
    onMouseUp,
    Icon = null,
    style,
    disabled,
    hover,
    ref: Ref,
    children,
    theme,
    ...props
}) => {
    if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);
    if (!(hover instanceof Observer)) hover = Observer.mutable(hover);
    if (!Ref) Ref = <raw:button />;
    if (label && typeof label === 'string') {
        label = <Typography type='p1' fontStyle='bold' inline>
            {label}
        </Typography>;
    }

    disabled = disabled.map(d => !!d);

    const [ripples, createRipple] = useRipples();

    return <Ref
        theme={[
            'button',
            theme,
            type,
            hover.map(h => h ? 'hovered' : null),
            disabled.map(d => d ? 'disabled' : null),
        ]}
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
        isHovered={hover}
        style={{
            display: inline ? 'inline-flex' : 'flex',
            ...style
        }}
        disabled={disabled}
        {...props}
    >
    	{Icon}
        {label ? label : children}
        {ripples}
    </Ref>
};

export default Button;
