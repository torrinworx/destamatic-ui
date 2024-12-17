import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	row: {
		display: 'flex',
		flexDirection: 'row',
	},

	row_inline: {
		display: 'inline-flex',
	},
});

export default ThemeContext.use(h => {
	const Row = ({ children, type, inline, ...props }) => {
		return <div {...props} theme={["row", type, inline ? 'inline' : null]}>
			{children}
		</div>;
	};

	return Row;
});
