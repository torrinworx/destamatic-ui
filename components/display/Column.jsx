import Theme from '../utils/Theme.jsx';
import ThemeContext from '../utils/ThemeContext.jsx';

Theme.define({
	column: {
		display: 'flex',
		flexDirection: 'column',
	},

	culumn_inline: {
		display: 'inline-flex',
	},
});

export default ThemeContext.use(h => {
	const Column = ({ children, type, inline, gap, style, ...props }) => {
		if (gap) style = {
			gap: gap,
			...style,
		};

		return <div
			{...props}
			style={style}
			theme={["column", type, inline ? 'inline' : null]}
		>
			{children}
		</div>;
	};

	return Column;
});
