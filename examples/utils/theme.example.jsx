import { mount, Observer, OObject } from 'destam-dom';
import { Theme, Button, Typography } from '../..';

const MyComponent = ({ type }) => {
	const hovered = Observer.mutable(false);

	return <div
		isHovered={hovered}
		theme={[
			type,
			"myDiv",
			hovered.map(h => h ? 'hovered' : null),
		]}
	>
		Hello world
	</div>;
};

const theme = OObject({
	"*": {
		// importing fonts into the document, could be from a local css file or url.
		_fontUrl_Edu: {
			url: 'https://fonts.googleapis.com/css2?family=Edu+NSW+ACT+Hand+Pre:wght@400..700&display=swap'
		},
		_fontUrl_Roboto: {
			url: 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,100..900;1,100..900&display=swap'
		},
		_fontUrl_PresStart2P: {
			url: 'https://fonts.googleapis.com/css2?family=Press+Start+2P&display=swap'
		},

		fontFamily: 'arial',
		fontWeight: 400,
		fontStyle: 'normal',
		transition: null,
	},

	edu: {
		fontFamily: '"Edu NSW ACT Hand Pre", cursive',
	},
	roboto: {
		fontFamily: '"Roboto", sans-serif',
	},

	presStart2P: {
		fontFamily: '"Press Start 2P", system-ui',
	},

	myPrimary: OObject({
		$color_background: 'aqua',
		$color: 'blue',
		$color_hover: 'red',
	}),

	mySecondary: {
		$color: 'orange',
		$color_hover: 'pink',
	},

	myDiv: {
		background: '$color',
		width: 100,
		height: 100,
		color: '$invert($color)',

		$background_color: 'blue',
	},

	hovered: {
		background: '$color_hover',
		color: '$invert($color_hover)',
	},

	body: {
		extends: 'myPrimary',
		inset: 0,
		position: 'absolute',
		background: '$color_background',
	},

	shiftHue: {
		$test_value: '$color',
		$color: '$hue($saturate($test_value, -.5), .3)',
	},

	row: {
		display: 'flex',
		flexDirection: 'row',
	},
});

mount(document.body, <Theme value={theme}>
	<div theme="body">
		<div theme="row">
			<MyComponent type="myPrimary" />
			<MyComponent type="myPrimary_shiftHue" />
		</div>
		<div theme="row">
			<MyComponent type="mySecondary" />
			<MyComponent type="mySecondary_shiftHue" />
		</div>
		<Button label="hello world" type="contained" />

		<div theme="myPrimary" style={{
			width: 200,
			height: 200,
			background: 'linear-gradient($color, $invert($color))'
		}} />

		<Typography type='h4_edu' label='Hello World with edu' />
		<Typography type='h4_roboto' label='Hello World with roboto' />
		<Typography type='h4_presStart2P' label='Hello World with presStart2P' />
		<Typography type='h4_LilitaOne' label='Hello World with LilitaOne' />
	</div>
</Theme>);

Observer.timer(1000).map(t => t % 2 === 0 ? 'blue' : 'lime').effect(color => (theme.myPrimary.$color = color, null));

setTimeout(() => {
	theme.button = {
		extends: ['radius'],

		width: '100%',

		userSelect: 'none',
		border: 'none',
		cursor: 'pointer',
		textDecoration: 'none',
		position: 'relative',
		overflow: 'clip',
		color: 'black',
		boxShadow: 'none',
	};
}, 1000);
