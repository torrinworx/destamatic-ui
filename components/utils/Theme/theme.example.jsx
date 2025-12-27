import { Theme, Button, ColorPicker, Typography } from 'destamatic-ui';
import color from 'destamatic-ui/util/color';

const Example = ({ globalTheme }) => {
	const custom = {
		candyPrimary: {
			$color: '#ff4da6',
			$color_alt: '#ffd54f',
		},

		button: {
			extends: 'candyPrimary',
			borderRadius: 999,
			padding: '12px 22px',
			letterSpacing: '0.04em',
			textTransform: 'uppercase',
			userSelect: 'none',
			border: 'none',
			cursor: 'pointer',
			position: 'relative',
			overflow: 'clip',
		},

		button_contained: {
			extends: 'button',
			background: 'linear-gradient(135deg, $color, $color_alt)',
			color: '$contrast_text($color)',
			boxShadow: '0 6px 16px $alpha($color, 0.5)',
		},

		button_contained_hovered: {
			extends: 'button_contained',
			background:
				'linear-gradient(135deg, $shiftBrightness($color, .1), $shiftBrightness($color_alt, .1))',
			transform: 'translateY(-1px)',
			boxShadow: '0 10px 24px $alpha($color, 0.7)',
		},
		button_outlined: {
			extends: 'button',
			borderWidth: 2,
			borderStyle: 'solid',
			borderColor: '$color',
			color: '$color',
			background: 'transparent',
		},

		button_outlined_hovered: {
			extends: 'button_outlined',
			borderColor: '$color_alt',
			color: '$color_alt',
		},
	}

	return <div style={{ margin: 10 }}>
		<div theme='column_center'>
			<ColorPicker value={globalTheme.observer.path(['primary', '$color']).setter((val, set) => set(color.toCSS(val)))} />
		</div>

		<Typography type='h2' label='Custom sub theme:' />
		<div theme='divider' />
		<div theme='row_wrap_fill_center'>
			<Typography type='h2' label='Default: ' />
			<Button type='contained' label='Click Me' />
			<Button type='outlined' label='Click Me' />
		</div>
		<Theme value={custom}>
			<div theme='row_wrap_fill_center'>
				<Typography type='h2' label='Candy: ' />
				<Button type='contained' label='Click Me' />
				<Button type='outlined' label='Click Me' />
			</div>
		</Theme>
	</div>
};

export default {
	open: true,
	example: Example,
	header: 'Theme',
};
