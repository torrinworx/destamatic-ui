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
		color: 'white',

		$background_color: 'blue',
	},

	hovered: {
		background: '$color_hover',
		color: 'black',
	},

	body: {
		extends: 'myPrimary',
		inset: 0,
		position: 'absolute',
		background: '$color_background',
	}
});

mount(document.body, <Theme value={theme}>
	<div theme="body">
		<MyComponent type="myPrimary"/>
		<MyComponent type="mySecondary"/>
		<Button label="hello world" type="contained" />
	</div>
</Theme>);

Observer.timer(1000).map(t => t % 2 === 0 ? 'blue' : 'green').effect(color => (theme.myPrimary.$color = color, null));

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
