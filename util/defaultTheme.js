import color from './color.js';

const transformHSV = callback => (c, ...params) => {
	let [r, g, b, a] = color(c);
	let [h, s, v] = color.rgbToHsv(r, g, b);

	[h, s, v] = callback(h, s, v, ...params.map(p => parseFloat(p)));

	[r, g, b] = color.hsvToRgb(h, s, v);
	return color.toCSS([r, g, b, a]);
};

const math = cb => (a, b) => {
	return String(cb(parseFloat(a), parseFloat(b)));
};

export default {
	"*": {
		fontFamily: 'Roboto, sans-serif',
		boxSizing: 'border-box',
		transition: 'opacity 250ms ease-out, box-shadow 250ms ease-out, background-color 250ms ease-in-out',

		/*
		Adjusts the brightness of the input colour by shifting its value in the HSV colour space. Accepts colours
		in hexadecimal, RGB, or HSV.
		*/
		$shiftBrightness: transformHSV((h, s, v, amount) => {
			if (v > 0.5) {
				v -= amount;
			} else {
				v += amount;
			}

			return [h, s, v];
		}),

		/*
		Adjusts the saturation of the input colour by shifting it's value in the HSV colour space. Accepts colours
		in hexadecimal, RGB, or HSV.
		*/
		$saturate: transformHSV((h, s, v, amount) => {
			return [h, s + amount, v];
		}),

		/*
		Adjusts the hue of the input colour by shifting it's value in the HSV colour space. Accepts colours in
		hexadecimal, RGB, or HSV.
		*/
		$hue: transformHSV((h, s, v, amount) => {
			return [h + amount, s, v];
		}),

		/*
		Inverts the RGB components of the input colour. Accepts colours in hexadecimal, RGB, or HSV.
		*/
		$invert: (c) => {
			let [r, g, b, a] = color(c);
			return color.toCSS([1 - r, 1 - g, 1 - b, a]);
		},

		/*
		Applies an alpha (transparency) value to the input colour. Accepts colours in hexadecimal, RGB, or HSV.
		*/
		$alpha: (c, amount) => {
			let [r, g, b] = color(c);
			return color.toCSS([r, g, b, parseFloat(amount)]);
		},

		/*
		Computes a contrast color (black or white) based on the luminance of the input colour to ensure readability
		compliant with WCAG 2.0 AAA standards. Accepts colours in hexadecimal, RGB, or HSV.
		*/
		$contrast_text: (c) => {
			const luminance = (r, g, b) => {
				const adjust = (value) => {
					return value <= 0.03928 ? value / 12.92 : Math.pow((value + 0.055) / 1.055, 2.4);
				};
				const [R, G, B] = [adjust(r), adjust(g), adjust(b)];
				return 0.2126 * R + 0.7152 * G + 0.0722 * B;
			};

			const contrastRatio = (L1, L2) => (L1 + 0.05) / (L2 + 0.05);

			let [r, g, b, a] = color(c);
			const backgroundLuminance = luminance(r, g, b);

			const contrastBlack = contrastRatio(backgroundLuminance, luminance(0, 0, 0));
			const contrastWhite = contrastRatio(luminance(1, 1, 1), backgroundLuminance);

			// Select color with greater contrast, use black if equal.
			const textColor = contrastBlack > contrastWhite ? [0, 0, 0, a] : [1, 1, 1, a];

			return color.toCSS(textColor);
		},

		$add: math((a, b) => a + b),
		$sub: math((a, b) => a - b),
		$div: math((a, b) => a / b),
		$mul: math((a, b) => a * b),
		$mod: math((a, b) => a % b),
		$min: math(Math.min),
		$max: math(Math.max),
		$floor: a => String(Math.floor(parseFloat(a))),
		$ceil: a => String(Math.ceil(parseFloat(a))),
		$round: a => String(Math.round(parseFloat(a))),
	},

	primary: {
		$color: '#02CA9F',
		$color_hover: '$shiftBrightness($color, 0.1)',
		$color_error: 'red',
		$color_top: '$contrast_text($color)',
	},

	secondary: {
		$color: '#CCCCCC',
		$color_hover: '$shiftBrightness($color, 0.1)',
		$color_error: 'red',
		$color_top: '$contrast_text($color)',
	},

	center: {
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
	},

	radius: {
		borderRadius: 6,
	},

	drawer: {
		extends: 'secondary',
		outlineColor: '$color',
		outlineWidth: 1,
		outlineStyle: 'solid',
	},

	disabled: {
		cursor: 'default',
		pointerEvents: 'none',
	},

	focusable: {
		borderStyle: 'solid',
		borderWidth: .5,
		borderColor: '$color',
		transitionDuration: '0.3s',
		transitionProperty: 'border-color, background-color, box-shadow',
	},

	field: {
		extends: 'radius_typography_p1_regular_focusable',
		outline: 0,

		padding: 10,
		background: '$invert($color_top)',
		color: '$color_top',
	},

	focused: {
		boxShadow: '$color 0 0 0 0.2rem',
	},

	expand: {
		flexGrow: 1,
		height: '100%',
	},

	tight: {
		padding: 0,
	},
};
