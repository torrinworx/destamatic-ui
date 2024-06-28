import h from '../h';

import Observer from 'destam/Observer';

import useRipples from '../Ripple.jsx';
import Theme from '../Theme.jsx';

let buttonStyles = {}

const createButtonStyles = () => buttonStyles = {
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
        borderRadius: Theme.borderRadius,
        lineHeight: '2.25rem',
        cursor: 'pointer',
        textDecoration: 'none',
        position: 'relative',
        overflow: 'hidden',
        transition: Theme.transition
    },
    text: {
        backgroundColor: 'transparent',
        color: 'black',
    },
    contained: {
        backgroundColor: Theme.colours.primary.base,
        color: Theme.colours.primary.onPrimary,
    },
    outlined: {
        backgroundColor: 'transparent',
        border: `2px solid ${Theme.colours.primary.lighter}`,
        color: Theme.colours.primary.base,
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
        transition: Theme.transition,
        borderRadius: Theme.borderRadius,
        boxShadow: hover.map(h => h ? Theme.boxShadow : null),
        filter: disabled?.map(d => d ? 'grayscale(100%)' : null),
        pointerEvents: disabled?.map(d => d ? 'none' : 'auto'),
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
                        return Theme.colours.primary.darker
                    case 'outlined':
                        return Theme.colours.primary.baseTrans
                }
            } else {
                return styleContainer.backgroundColor
            }
        }),
        color: hover.map(h => {
            if (h) {
                switch (type) {
                    case 'text':
                        return Theme.colours.primary.base
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
    label='',
    type='text',
    onClick,
    Icon,
    style,
    disabled,
    hover,
    ref: Ref,
    ...props
}) => {
    if (!Object.keys(buttonStyles).length) createButtonStyles()
    /*
    `disabled` is expected to be an observer.
    */
    if (!hover) {
        hover = Observer.mutable(false);
    };

    const rippleColour  = (() => {
        switch (type) {
            case 'text':
                return Theme.colours.ripple.dark
            case 'contained':
                return Theme.colours.ripple.light
            case 'outlined':
                return Theme.colours.ripple.dark
        }
    })();

    const [ripples, createRipple] = useRipples(rippleColour);

    if (!Ref) {
        Ref = <div />;
    }

    return <Ref style={style} {...props}>
        <button
            onClick={(event) => {
                createRipple(event);
                onClick && onClick(event);
            }}
            onMouseEnter={() => hover.set(true)}
            onMouseLeave={() => hover.set(false)}
            style={getStyles(style, disabled, type, hover)}
            disabled={disabled?.map(d =>{
                if (label === 'Ask') console.log(Ref)
                return d ? true : false
            })}
        >
            {Icon ? <i style={buttonStyles.icon}>{Icon}</i> : null}
            {label ? <div style={{margin: '10px 20px'}}>{label}</div>: null}
            {ripples}
        </button>
    </Ref>;
};

export default Button;
