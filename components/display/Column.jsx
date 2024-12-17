import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';

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
	const Column = ({ children, type, inline, ...props }) => {
		return <div {...props} theme={["column", type, inline ? 'inline' : null]}>
			{children}
		</div>;
	};

	return Column;
});
