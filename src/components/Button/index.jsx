import h from '../h';
import Observer from 'destam/Observer';
import useRipples from '../Ripple.jsx';
import Shared from '../Shared.jsx';

const Button = ({
    label = '',
    type = 'text',
    onClick,
    Icon,
    style,
    disabled,
    hover,
    ref: Ref,
    ...props
}) => {
    if (!disabled) disabled = Observer.mutable(false);
    if (!hover) hover = Observer.mutable(false);
    if (!Ref) Ref = <div />;

    const [ripples, createRipple] = useRipples((() => {
        switch (type) {
            case 'text':
                return Shared.Theme.colours.ripple.dark;
            case 'contained':
                return Shared.Theme.colours.ripple.light;
            case 'outlined':
                return Shared.Theme.colours.ripple.dark;
        }
    })());

    const buttonStyle = {
        ...Shared.Theme.Button.base,
        ...Shared.Theme.Button[type].base,
        transition: Shared.Theme.transition,
        borderRadius: Shared.Theme.borderRadius,
        boxShadow: hover.map(h => h ? Shared.Theme.boxShadow : null),
        ...style,
        backgroundColor: disabled.map(d => d ? Shared.Theme.Button[type].disabled.backgroundColor || Shared.Theme.Button[type].base.backgroundColor : hover.map(h => h ? Shared.Theme.Button[type].hover.backgroundColor : Shared.Theme.Button[type].base.backgroundColor)),
        color: disabled.map(d => d ? Shared.Theme.Button[type].disabled.color || Shared.Theme.Button[type].base.color : hover.map(h => h ? Shared.Theme.Button[type].hover.color : Shared.Theme.Button[type].base.color)),
        cursor: disabled.map(d => d ? Shared.Theme.Button[type].disabled.cursor : Shared.Theme.Button.base.cursor),
        filter: disabled.map(d => d ? Shared.Theme.Button[type].disabled.filter : 'none'),
        pointerEvents: disabled.map(d => d ? Shared.Theme.Button[type].disabled.pointerEvents : 'auto'),
    }

    return (
        <Ref style={style} {...props}>
            <button
                onClick={(event) => {
                    createRipple(event);
                    onClick && onClick(event);
                }}
                onMouseEnter={() => hover.set(true)}
                onMouseLeave={() => hover.set(false)}
                style={buttonStyle}
                disabled={disabled.map(d => d ? true : false)}
            >
                {Icon ? <i style={Shared.Theme.Button.icon.base}>{Icon}</i> : null}
                {label ? <div style={{ margin: '10px 20px' }}>{label}</div> : null}
                {ripples}
            </button>
        </Ref>
    );
};

export default Button;
