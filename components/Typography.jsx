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
const Typography = ({ inline, type = 'h1', fontStyle = 'regular', bold, children, style, ...props }) => {
    if (bold) fontStyle = 'bold';

    return <div
        theme={['typography', type, fontStyle]}
        style={{
            display: inline ? 'inline-block' : 'block',
            ...style
        }}
        {...props}
    >
        {children}
    </div>;
};

export default Typography;
