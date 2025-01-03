import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	typography: {
		display: 'flex',
	},

	typography_h1: { fontSize: 62, textWrap: 'nowrap' },
	typography_h2: { fontSize: 56, textWrap: 'nowrap' },
	typography_h3: { fontSize: 36, textWrap: 'nowrap' },
	typography_h4: { fontSize: 30, textWrap: 'nowrap' },
	typography_h5: { fontSize: 24, textWrap: 'nowrap' },
	typography_h6: { fontSize: 20, textWrap: 'nowrap' },
	typography_p1: { fontSize: 16 },
	typography_p2: { fontSize: 14 },
	typography_regular: { fontStyle: 'normal' },
	typography_bold: { fontWeight: 'bold' },
	typography_italic: { fontStyle: 'italic' },
	typography_center: { textAlign: 'center' },

	typography_inline: {
		display: 'inline-flex',
	}
});

export default ThemeContext.use(h => {
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
	const Typography = ({ inline, type = 'h1', fontStyle = 'regular', bold, center, children, ...props }) => {
		if (bold) fontStyle = 'bold';

		return <div
			{...props}
			theme={['typography', type, center ? 'center' : null, inline ? 'inline' : null, fontStyle]}
		>
			{children}
		</div>;
	};

	return Typography;
});
