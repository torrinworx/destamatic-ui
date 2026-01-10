import Theme from '../Theme/Theme.jsx';
import ThemeContext from '../ThemeContext/ThemeContext.jsx';

Theme.define({
	loadingDots: {
		extends: 'row_tight'
	},

	loadingDots_dot: {
		_keyframes_animationName: `
			0%, 100% { opacity: 0; }
			50% { opacity: 1; }
		`,

		background: '$color',
		display: 'inline-block',
		width: 'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)',
		height: 'clamp(0.75rem, 0.75vw + 0.375rem, 1.25rem)',
		borderRadius: '50%',
		animationName: '$animationName',
		animationDuration: '1s',
		animationIterationCount: 'infinite',
		animationTimingFunction: 'ease-in-out',
		margin: '0px 4px',
	},

	loadingDots_dot_contained: {
		background: '$color_top',
	},
});

export default ThemeContext.use(h => {
	const LoadingDots = ({ type }) => {
		return <div ref theme='loadingDots'>
			<span theme={['loadingDots', 'dot', type]} style={{ animationDelay: '0s' }}></span>
			<span theme={['loadingDots', 'dot', type]} style={{ animationDelay: '.2s' }}></span>
			<span theme={['loadingDots', 'dot', type]} style={{ animationDelay: '.4s' }}></span>
		</div>;
	};

	return LoadingDots;
});
