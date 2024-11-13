import {mount, Observer, OObject} from 'destam-dom';
import {Theme, Button} from '..';

const MyComponent = ({type}) => {
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
		fontFamily: 'arial',
		transition: null,
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
			<MyComponent type="myPrimary"/>
			<MyComponent type="myPrimary_shiftHue"/>
		</div>
		<div theme="row">
			<MyComponent type="mySecondary"/>
			<MyComponent type="mySecondary_shiftHue"/>
		</div>
		<Button label="hello world" type="contained" />
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
