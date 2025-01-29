import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';

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
	const Paper = ({ ref: Ref, children, type, tight, ...props }) => {
		if (!Ref) Ref = <raw:div />;

		return <Ref {...props} theme={["paper", type, tight ? 'tight' : null]}>
			{children}
		</Ref>;
	};

	return Paper;
});
