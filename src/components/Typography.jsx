import { h } from './h';
import Theme from './Theme';

/**
 * Typography component for rendering text with different styles and types.
 * 
 * @param {Object} props - The properties object.
 * @param {string} [props.type='h1'] - The typography type, which determines the textual style. Must be a key in `Shared.Theme.Typography`.
 * @param {string} [props.fontStyle='regular'] - The font style for the typography. Must be a key under the specified type in `Shared.Theme.Typography`.
 * @param {JSX.Element | string} props.children - The content to be displayed inside the typography component.
 * @param {Object} [props.style] - Custom styles to be applied to the typography component.
 * @param {...Object} [props] - Additional properties to spread onto the typography element.
 * 
 * @returns {JSX.Element} The rendered typography element.
 */
const Typography = Theme.use(theme => ({ inline, type = 'h1', fontStyle = 'regular', children, style, ...props }) => {
    const validType = Object.keys(theme.Typography)
        .includes(type) ? type : 'h1';

    const validFontStyle = Object.keys(theme.Typography[validType])
        .includes(fontStyle) ? fontStyle : 'regular';

    return <div
        style={{
            ...style,
            display: inline ? 'inline-block' : 'block',
            font: theme.Typography[validType][validFontStyle]
        }}
        {...props}
    >
        {children}
    </div>;
});

export default Typography;
