import { h } from './h';
import Theme from './Theme';

Theme.define({
    typography_h1: { fontSize: 62 },
    typography_h2: { fontSize: 56 },
    typography_h3: { fontSize: 36 },
    typography_h4: { fontSize: 30 },
    typography_h5: { fontSize: 24 },
    typography_h6: { fontSize: 20 },
    typography_p1: { fontSize: 16 },
    typography_p2: { fontSize: 14 },
    typography_regular: { fontStyle: 'normal' },
    typography_bold: { fontWeight: 'bold' },
    typography_italic: { fontStyle: 'italic' },
});

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
