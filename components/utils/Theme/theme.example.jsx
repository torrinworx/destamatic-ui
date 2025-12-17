import { mount } from 'destam-dom';
import { Theme, Button } from 'destamatic-ui';

const Example = () => {
	const custom = {
		candyPrimary: {
			$color: '#ff4da6',
			$color_alt: '#ffd54f',
		},

		button_contained: {
			extends: 'button_candyPrimary',
			background: 'linear-gradient(135deg, $color, $color_alt)',
		},

		button_contained_hovered: {
			extends: 'button_contained_candyPrimary',
			background:
				'linear-gradient(135deg, $shiftBrightness($color, .1), $shiftBrightness($color_alt, .1))'
		},
	}

	return <Theme value={custom}>
		<Button type='contained' label='Click Me' />
	</Theme>
};

mount(root, <Example />);
