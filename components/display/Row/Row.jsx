import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

Theme.define({
	row: {
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
	},

	row_inline: {
		display: 'inline-flex',
	},

	row_wrap: {
		flexWrap: 'wrap',
		gap: 10,
	},
});

export default ThemeContext.use(h => {
	const Row = ({ children, type, inline, gap, style, ...props }) => {
		if (gap) style = {
			gap: gap,
			...style,
		};

		return <div
			{...props}
			style={style}
			theme={["row", type, inline ? 'inline' : null]}
		>
			{children}
		</div>;
	};

	return Row;
});
