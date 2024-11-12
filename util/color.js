// ripped from https://gist.github.com/mjackson/5311256
/**
 * Converts an HSL color value to RGB. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes h, s, and l are contained in the set [0, 1] and
 * returns r, g, and b in the set [0, 1].
 *
 * @param   Number  h       The hue
 * @param   Number  s       The saturation
 * @param   Number  l       The lightness
 * @return  Array           The RGB representation
 */
const hslToRgb = (h, s, l) => {
	let r, g, b;

	if (s === 0) {
		r = g = b = l; // achromatic
	} else {
		const hue2rgb = (p, q, t) => {
			if (t < 0) t += 1;
			if (t > 1) t -= 1;
			if (t < 1/6) return p + (q - p) * 6 * t;
			if (t < 1/2) return q;
			if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
			return p;
		};

		let q = l < 0.5 ? l * (1 + s) : l + s - l * s;
		let p = 2 * l - q;

		r = hue2rgb(p, q, h + 1/3);
		g = hue2rgb(p, q, h);
		b = hue2rgb(p, q, h - 1/3);
	}

	return [ r, g, b ];
};

/**
 * Converts an RGB color value to HSL. Conversion formula
 * adapted from http://en.wikipedia.org/wiki/HSL_color_space.
 * Assumes r, g, and b are contained in the set [0, 1] and
 * returns h, s, and l in the set [0, 1].
 *
 * @param   Number  r       The red color value
 * @param   Number  g       The green color value
 * @param   Number  b       The blue color value
 * @return  Array           The HSL representation
 */
const rgbToHsl = (r, g, b) => {
	let max = Math.max(r, g, b), min = Math.min(r, g, b);
	let h, s, l = (max + min) / 2;

	if (max === min) {
		h = s = 0; // achromatic
	} else {
		let d = max - min;
		s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

		switch (max) {
			case r: h = (g - b) / d + (g < b ? 6 : 0); break;
			case g: h = (b - r) / d + 2; break;
			default: h = (r - g) / d + 4; break;
		}

		h /= 6;
	}

	return [ h, s, l ];
};

const hsvToRgb = (h, s, v) => {
	let r, g, b, i, f, p, q, t;

	i = Math.floor(h * 6);
	f = h * 6 - i;
	p = v * (1 - s);
	q = v * (1 - f * s);
	t = v * (1 - (1 - f) * s);
	switch (i % 6) {
		case 0: r = v; g = t; b = p; break;
		case 1: r = q; g = v; b = p; break;
		case 2: r = p; g = v; b = t; break;
		case 3: r = p; g = q; b = v; break;
		case 4: r = t; g = p; b = v; break;
		default: r = v; g = p; b = q; break;
	}
	return [ r, g, b ];
};

const rgbToHsv = (r, g, b) => {
	let max = Math.max(r, g, b), min = Math.min(r, g, b),
		d = max - min,
		h,
		s = (max === 0 ? 0 : d / max),
		v = max;

	switch (max) {
		case min: h = 0; break;
		case r: h = (g - b) + d * (g < b ? 6: 0); h /= 6 * d; break;
		case g: h = (b - r) + d * 2; h /= 6 * d; break;
		default: h = (r - g) + d * 4; h /= 6 * d; break;
	}

	return [ h, s, v ];
};

const hex = "0123456789ABCDEF";

const getColor = (...args) => {
	if (args.length > 1){
		return getColor(args.flatMap(e => {
			if (e && typeof e[Symbol.iterator] === 'function') return [...e];
			return e;
		}));
	}else{
		let color = args[0];

		if (color === undefined || color === null) {
			color = [0, 0, 0, 1];
		}

		let parseNum = (n, lim) => {
			n = n.trim();

			if (n.charAt(n.length - 1) === '%'){
				return parseFloat(n.substring(0, n.length - 1)) / 100;
			}else{
				return parseFloat(n) / lim;
			}
		};

		let functional = (color, bounds) => {
			if (color.indexOf(',') >= 0) {
				return color.split(',').map((e, i) => parseNum(e, bounds[i]));
			} else if (color.indexOf('/') >= 0) {
				return color.split('/').map(e => e.trim().split(' ')).flat().map((e, i) => parseNum(e, bounds[i]));
			} else {
				return color.split(' ').map((e, i) => parseNum(e, bounds[i]));
			}
		};

		let parseHex = str => {
			str = str.toUpperCase();
			let num = 0;

			for (let i = 0; i < str.length; i++){
				num <<= 4;
				num |= hex.indexOf(str[i]);
			}

			return num;
		};

		if (typeof color === 'string'){
			color = color.trim().toLowerCase();

			if (color.indexOf('rgb') === 0){
				if (color.indexOf('rgba') === 0){
					color = color.substring(4).trim();
				}else{
					color = color.substring(3).trim();
				}

				color = functional(color.substring(1, color.length - 1), [255, 255, 255, 1]);
			}else if (color.indexOf('hsl') === 0){
				if (color.indexOf('hsla') === 0){
					color = color.substring(4).trim();
				}else{
					color = color.substring(3).trim();
				}

				let c = functional(color.substring(1, color.length - 1), [360, 100, 100, 1]);
				c.xyz = hslToRgb(...c.xyz);
				color = c;
			}else if (color.charAt(0) === '#' && color.length === 4){
				color = [color.substring(1, 2), color.substring(2, 3), color.substring(3, 4)].map(e => parseHex(e) / 15);
			}else if (color.charAt(0) === '#' && color.length === 7){
				color = [color.substring(1, 3), color.substring(3, 5), color.substring(5, 7)].map(e => parseHex(e) / 255);
			}else if (color.charAt(0) === '#' && color.length === 5){
				color = [color.substring(1, 2), color.substring(2, 3), color.substring(3, 4), color.substring(4, 5)].map(e => parseHex(e) / 15);
			}else if (color.charAt(0) === '#' && color.length === 9){
				color = [color.substring(1, 3), color.substring(3, 5), color.substring(5, 7), color.substring(7, 9)].map(e => parseHex(e) / 255);
			}else{
				color = getColor(map[color]);
			}
		}else if (ArrayBuffer.isView(color)){
			if (color.length === 1){
				color = Math.vec4(color, color, color, 1);
			}else if (color.length === 2){
				color = Math.vec4(color[0], color[0], color[0], color[1]);
			}else if (color.length === 3){
				color = Math.vec4(color, 1);
			}
		}

		if (isNaN(color[0])) color[0] = 0;
		if (isNaN(color[1])) color[1] = 0;
		if (isNaN(color[2])) color[2] = 0;
		if (isNaN(color[3])) color[3] = 1;

		return color;
	}
};

getColor.hslToRgb = hslToRgb;
getColor.rgbToHsl = rgbToHsl;
getColor.hsvToRgb = hsvToRgb;
getColor.rgbToHsv = rgbToHsv;

getColor.toCSS = color => {
	let r = color[0];
	let g = color[1];
	let b = color[2];
	let a = 1;

	if (color.length >= 4) a = color[3];

	r = Math.min(Math.max(Math.floor(r * 255), 0), 255);
	g = Math.min(Math.max(Math.floor(g * 255), 0), 255);
	b = Math.min(Math.max(Math.floor(b * 255), 0), 255);

	if (a === 1){
		return '#' + hex[r >> 4] + hex[r & 15] + hex[g >> 4] + hex[g & 15] + hex[b >> 4] + hex[b & 15];
	}else{
		return 'rgba(' + [r, g, b, a].join(',') + ')';
	}
};

const map = {
	black: '#000000',
	silver: '#c0c0c0',
	gray: '#808080',
	white: '#ffffff',
	maroon: '#800000',
	red: '#ff0000',
	purple: '#800080',
	fuchsia: '#ff00ff',
	green: '#008000',
	lime: '#00ff00',
	olive: '#808000',
	yellow: '#ffff00',
	navy: '#000080',
	blue: '#0000ff',
	teal: '#008080',
	aqua: '#00ffff',
	orange: '#ffa500',
	aliceblue: '#f0f8ff',
	antiquewhite: '#faebd7',
	aquamarine: '#7fffd4',
	azure: '#f0ffff',
	beige: '#f5f5dc',
	bisque: '#ffe4c4',
	blanchedalmond: '#ffebcd',
	blueviolet: '#8a2be2',
	brown: '#a52a2a',
	burlywood: '#deb887',
	cadetblue: '#5f9ea0',
	chartreuse: '#7fff00',
	chocolate: '#d2691e',
	coral: '#ff7f50',
	cornflowerblue: '#6495ed',
	cornsilk: '#fff8dc',
	crimson: '#dc143c',
	cyan: '#00ffff',
	darkblue: '#00008b',
	darkcyan: '#008b8b',
	darkgoldenrod: '#b8860b',
	darkgray: '#a9a9a9',
	darkgreen: '#006400',
	darkgrey: '#a9a9a9',
	darkkhaki: '#bdb76b',
	darkmagenta: '#8b008b',
	darkolivegreen: '#556b2f',
	darkorange: '#ff8c00',
	darkorchid: '#9932cc',
	darkred: '#8b0000',
	darksalmon: '#e9967a',
	darkseagreen: '#8fbc8f',
	darkslateblue: '#483d8b',
	darkslategray: '#2f4f4f',
	darkslategrey: '#2f4f4f',
	darkturquoise: '#00ced1',
	darkviolet: '#9400d3',
	deeppink: '#ff1493',
	deepskyblue: '#00bfff',
	dimgray: '#696969',
	dimgrey: '#696969',
	dodgerblue: '#1e90ff',
	firebrick: '#b22222',
	floralwhite: '#fffaf0',
	forestgreen: '#228b22',
	gainsboro: '#dcdcdc',
	ghostwhite: '#f8f8ff',
	gold: '#ffd700',
	goldenrod: '#daa520',
	greenyellow: '#adff2f',
	grey: '#808080',
	honeydew: '#f0fff0',
	hotpink: '#ff69b4',
	indianred: '#cd5c5c',
	indigo: '#4b0082',
	ivory: '#fffff0',
	khaki: '#f0e68c',
	lavender: '#e6e6fa',
	lavenderblush: '#fff0f5',
	lawngreen: '#7cfc00',
	lemonchiffon: '#fffacd',
	lightblue: '#add8e6',
	lightcoral: '#f08080',
	lightcyan: '#e0ffff',
	lightgoldenrodyellow: '#fafad2',
	lightgray: '#d3d3d3',
	lightgreen: '#90ee90',
	lightgrey: '#d3d3d3',
	lightpink: '#ffb6c1',
	lightsalmon: '#ffa07a',
	lightseagreen: '#20b2aa',
	lightskyblue: '#87cefa',
	lightslategray: '#778899',
	lightslategrey: '#778899',
	lightsteelblue: '#b0c4de',
	lightyellow: '#ffffe0',
	limegreen: '#32cd32',
	linen: '#faf0e6',
	magenta: '#ff00ff',
	mediumaquamarine: '#66cdaa',
	mediumblue: '#0000cd',
	mediumorchid: '#ba55d3',
	mediumpurple: '#9370db',
	mediumseagreen: '#3cb371',
	mediumslateblue: '#7b68ee',
	mediumspringgreen: '#00fa9a',
	mediumturquoise: '#48d1cc',
	mediumvioletred: '#c71585',
	midnightblue: '#191970',
	mintcream: '#f5fffa',
	mistyrose: '#ffe4e1',
	moccasin: '#ffe4b5',
	navajowhite: '#ffdead',
	oldlace: '#fdf5e6',
	olivedrab: '#6b8e23',
	orangered: '#ff4500',
	orchid: '#da70d6',
	palegoldenrod: '#eee8aa',
	palegreen: '#98fb98',
	paleturquoise: '#afeeee',
	palevioletred: '#db7093',
	papayawhip: '#ffefd5',
	peachpuff: '#ffdab9',
	peru: '#cd853f',
	pink: '#ffc0cb',
	plum: '#dda0dd',
	powderblue: '#b0e0e6',
	rosybrown: '#bc8f8f',
	royalblue: '#4169e1',
	saddlebrown: '#8b4513',
	salmon: '#fa8072',
	sandybrown: '#f4a460',
	seagreen: '#2e8b57',
	seashell: '#fff5ee',
	sienna: '#a0522d',
	skyblue: '#87ceeb',
	slateblue: '#6a5acd',
	slategray: '#708090',
	slategrey: '#708090',
	snow: '#fffafa',
	springgreen: '#00ff7f',
	steelblue: '#4682b4',
	tan: '#d2b48c',
	thistle: '#d8bfd8',
	tomato: '#ff6347',
	turquoise: '#40e0d0',
	violet: '#ee82ee',
	wheat: '#f5deb3',
	whitesmoke: '#f5f5f5',
	yellowgreen: '#9acd32',
	rebeccapurple: '#663399',
};

export default getColor;
