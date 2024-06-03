import h from '../h';

import Observer from 'destam/Observer';

import useRipples from '../Ripple.jsx';
import { colours, borderRadius, boxShadow, transition  } from '../Theme.jsx';

const buttonStyles = {
    base: {
        fontFamily: 'Roboto, sans-serif',
        fontSize: '0.875rem',
        fontWeight: 'bold',
        height: '40px',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        userSelect: 'none',
        border: 'none',
        outline: 'none',
        borderRadius: borderRadius,
        lineHeight: '2.25rem',
        cursor: 'pointer',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
        transition: transition
    },
    text: {
        backgroundColor: 'transparent',
        color: 'black',
    },
    contained: {
        backgroundColor: colours.primary.base,
        color: colours.primary.onPrimary,
    },
    outlined: {
        backgroundColor: 'transparent',
        border: `2px solid ${colours.primary.lighter}`,
        color: colours.primary.base,
    },
    icon: {
        margin: '0px 6px 0px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '24px',
    }
}

const getStyles = (style, disabled, type, hover) => {
    // Internal wrapper for getting around issue where styles dictionary can't be observers
    const styleContainer = {
        cursor: disabled?.map(d => d ? 'default' : buttonStyles.base.cursor),
        ...buttonStyles.base,
        ...(type === 'text' && buttonStyles.text),
        ...(type === 'contained' && buttonStyles.contained),
        ...(type === 'outlined' && buttonStyles.outlined),
        boxShadow: hover.map(h => h ? boxShadow : null),
        filter: disabled?.map(d => d ? 'grayscale(100%)' : null),
        pointerEvents: disabled?.map(d => d ? 'none' : buttonStyles.base.pointerEvents),
        ...style,
    };

    return {
        ...styleContainer,
        backgroundColor: hover.map(h => {
            if (h) {
                switch (type) {
                    case 'text':
                        return 'transparent'
                    case 'contained':
                        return colours.primary.darker
                    case 'outlined':
                        return colours.primary.baseTrans
                }
            } else {
                return styleContainer.backgroundColor
            }
        }),
        color: hover.map(h => {
            if (h) {
                switch (type) {
                    case 'text':
                        return colours.primary.base
                    case 'contained':
                        return styleContainer.color
                    case 'outlined':
                        return styleContainer.color
                }
            } else {
                return styleContainer.color
            }
        })
    }
}

const Button = ({
    children,
    label='',
    type='text',
    onClick,
    Icon,
    style,
    disabled,
    hover,
    ...props
}) => {
    /*
    `disabled` is expected to be an observer.
    */
    if (!hover) {
        hover = Observer.mutable(false);
    };

    const rippleColour  = (() => {
        switch (type) {
            case 'text':
                return colours.ripple.dark
            case 'contained':
                return colours.ripple.light
            case 'outlined':
                return colours.ripple.dark
        }
    })();

    const [ripples, createRipple] = useRipples(rippleColour);

    return <div style={{
        transition: transition,
        borderRadius: borderRadius,
        display: 'inline-block',
    }} {...props}>
        <button
            onClick={(event) => {
                createRipple(event);
                onClick && onClick(event);
            }}
            onMouseEnter={() => hover.set(true)}
            onMouseLeave={() => hover.set(false)}
            style={getStyles(style, disabled, type, hover)}
            $disabled={disabled?.map(d => d ? true : false)}
        >
            {Icon ? <i style={buttonStyles.icon}>{Icon}</i> : null}
            {label ? <div style={{margin: '10px 20px'}}>{label}</div>: null}
            {ripples}
        </button>
    </div>;
};

export default Button;
