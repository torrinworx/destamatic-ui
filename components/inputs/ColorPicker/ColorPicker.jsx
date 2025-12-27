import Observer from 'destam/Observer';

import color from '../../../util/color.js';
import useAbort from '../../../util/abort.js';

import Slider from '../Slider/Slider.jsx';
import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

/*
TODO:
- Keep transition effect on slider focused theme while continuing to remove it from the color of the sliderthumb.
- Add focused effect to colorPicker_viewThumb and colorPicker_view outlined/focused thing like in Button/Slider.
- Add hovered effect.

*/


Theme.define({
	colorPicker: {
		extends: 'radius',
		cursor: 'pointer',
	},

	colorPicker_base: {
		display: 'flex',
		flexDirection: 'column',
		gap: 10,
		width: 200,
	},

	colorPicker_view: {
		width: '100%',
		height: 150,
		position: 'relative',
	},

	colorPicker_viewThumb: {
		$size: 15,

		borderRadius: '50%',
		position: 'absolute',

		width: '$size$px',
		height: '$size$px',
		transform: 'translate(-50%, -50%)',
		border: '1px solid $color_top',
		pointerEvents: 'none',
	},

	colorPicker_alpha_slidertrack: {
		background: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQAWJ84A0+ScZRAxiGSRgQSAb40wkoDAgBvAlt1AAGcEIiBGgbiAAgXwixcH9GzgAAAABJRU5ErkJggg==") left center',
	},

	colorPicker_alpha_slidertrack_hovered: {
		background: 'url("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAMUlEQVQ4T2NkYGAQAWJ84A0+ScZRAxiGSRgQSAb40wkoDAgBvAlt1AAGcEIiBGgbiAAgXwixcH9GzgAAAABJRU5ErkJggg==") left center',
	},
});

let hsvCurve = Array(7).fill(null).map((_, i) => {
	let prc = i / 6;
	return color.toCSS(color.hsvToRgb(prc, 1, 1)) + ' ' + (prc * 100) + '%';
}).join();

const clamp = v => Math.max(Math.min(v, 1), 0);

export default ThemeContext.use(h => {
	const ColorPicker = ({ value: valueRGB, hasAlpha = true }, cleanup) => {
		// covert the value (which is default rgb to hsv)
		const value = Observer.mutable();

		let mutateSelf = false;
		cleanup(valueRGB.effect(c => {
			if (mutateSelf) return;

			const [r, g, b, a] = color(c);
			value.set([...color.rgbToHsv(r, g, b), a]);
		}));

		cleanup(value.watch(() => {
			mutateSelf = true;
			const v = value.get();
			valueRGB.set([...color.hsvToRgb(v[0], v[1], v[2]), v[3]]);
			mutateSelf = false;
		}));

		const primary = value.map(([h]) => {
			const [r, g, b] = color.hsvToRgb(h, 1, 1);
			return color.toCSS([r, g, b]);
		});

		const fullColor = value.map(([h, s, v]) => {
			const [r, g, b] = color.hsvToRgb(h, s, v);
			return color.toCSS([r, g, b]);
		});

		const viewClicked = Observer.mutable(false);
		cleanup(viewClicked.effect(useAbort((signal, clicked) => {
			if (!clicked) return;

			const handler = e => {
				let [h, s, v, a] = value.get();

				const size = clicked.target.getBoundingClientRect();
				s = clamp((e.clientX - size.left) / size.width);
				v = clamp(1 - (e.clientY - size.top) / size.height);

				value.set([h, s, v, a]);
			};

			handler(clicked);

			const cancel = () => viewClicked.set(false);
			window.addEventListener('mousemove', handler, { signal });
			window.addEventListener('mouseup', cancel, { signal });
		})));

		return <div theme={['colorPicker', 'base']}>
			<div theme={['colorPicker', 'view']} onMouseDown={e => {
				e.preventDefault();
				viewClicked.set(e);
			}}>
				<div style={{ position: 'absolute', inset: 0, transition: 'unset', background: primary }} />
				<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to right, white, rgba(0, 0, 0, 0))' }} />
				<div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, black, rgba(0, 0, 0, 0))' }} />
				<div theme={['colorPicker', 'viewThumb']} style={{
					left: value.map(hsv => Math.round(hsv[1] * 100) + '%'),
					top: value.map(hsv => Math.round((1 - hsv[2]) * 100) + '%'),
					background: fullColor,
				}} />
			</div>

			<Slider
				theme={['colorPicker']}
				value={value.map(([h]) => h, h => {
					const [_, s, v, a] = value.get();
					return [h, s, v, a];
				})}
				min={0}
				max={1}
				cover={false}
				styleThumb={{ background: primary }}
				styleTrack={{ background: `linear-gradient(to right, ${hsvCurve})` }}
			/>

			{hasAlpha ? <Slider
				theme={['colorPicker', 'alpha']}
				value={value.map(hsv => hsv[3], a => {
					const [h, s, v, _] = value.get();
					return [h, s, v, a];
				})}
				min={0}
				max={1}
				cover={false}
				styleThumb={{ background: fullColor }}
				styleTrack={{ background: null }}
			>
				<div theme='colorPicker_alpha' style={{
					inset: 0,
					position: 'absolute',
					borderRadius: 'inherit',
					background: fullColor.map(fc => `linear-gradient(to right, rgba(0, 0, 0, 0), ${fc})`)
				}} />
			</Slider> : null}
		</div>;
	};

	return ColorPicker;
});
