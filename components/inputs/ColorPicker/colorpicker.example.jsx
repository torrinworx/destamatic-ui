import { Typography, ColorPicker, OObject, Theme, ThemeContext } from 'destamatic-ui';
import color from 'destamatic-ui/util/color';

const Example = () => {
	const specialTheme = OObject({
		special: OObject({
			transition: 'none',
			$color_text: 'black'
		}),
		typography: {
			$lh_body: '1.65',
			$lh_head: '1.15',
			$measure: '80ch',
			whiteSpace: 'pre-wrap',
			margin: 0,
			fontWeight: '400',
			color: '$color_text'
		},
	});

	return <div style={{ padding: 10 }}>
		<div theme='row_center_wrap'>
			<Theme value={specialTheme}>
				<ThemeContext value="special">
					<Typography type='h4' label='Hello World!' style={{ background: specialTheme.observer.path(['special', '$color_text']).map(c => `$contrast_text(${c})`) }} />
				</ThemeContext>
			</Theme>

			<div theme='row_fill_center' style={{ gap: 20 }}>
				<ColorPicker value={specialTheme.observer.path(['special', '$color_text']).setter((val, set) => set(color.toCSS(val)))} />
			</div>
		</div>
	</div>;
};

export default {
	example: Example,
	header: 'ColorPicker',
};
