import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

Theme.define({
	paper: {
		extends: 'radius_shadow',
		background: '$invert($color_top)',
		color: '$color_top',
		padding: 10,
		maxWidth: 'inherit',
		maxHeight: 'inherit',
	},
});

export default ThemeContext.use(h => {
	const Paper = ({ children, type, tight, ...props }) => {
		return <div {...props} ref theme={["paper", type, tight ? 'tight' : null]}>
			{children}
		</div>;
	};

	return Paper;
});
