import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	paper: {
		extends: 'radius',
		background: '$invert($color_top)',
		color: '$color_top',
		boxShadow: '4px 4px 10px $alpha($color_top, 0.2)',
		padding: 10,
		maxWidth: 'inherit',
		maxHeight: 'inherit',
		overflow: 'hidden',
	},
});

export default ThemeContext.use(h => {
	const Paper = ({ children, type, tight, ...props }) => {
		return <div {...props} theme={["paper", type, tight ? 'tight' : null]}>
			{children}
		</div>;
	};

	return Paper;
});
