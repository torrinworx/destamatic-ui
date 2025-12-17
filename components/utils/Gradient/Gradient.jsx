// import { atomic } from 'destam/Network';
import { OArray, Observer } from 'destam-dom';

import { h } from '../utils/h.jsx';
import Theme from '../utils/Theme.jsx';
import ThemeContext from '../utils/ThemeContext.jsx';

Theme.define({
	gradient: {
		extends: 'primary',
		$gradientCSS: 'linear-gradient(to top right, $color, $color_top)',
	},

	gradientOuter: {
		position: 'relative',
		width: '100%',
		height: '100%',
	},
	gradientFill: {
		position: 'fixed',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		pointerEvents: 'none',
	},
	gradientLayer: {
		position: 'absolute',
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		transition: 'opacity 250ms ease-in-out',
	},
	gradientContent: {
		position: 'relative',
		overflowY: 'auto',
	},
});

export default ThemeContext.use(h => Theme.use(theme => {
	/**
	 * Gradient component that creates a dynamic, animated gradient background.
	 *
	 * The component manages a list of gradient layers that can transition smoothly
	 * as the theme's gradient CSS changes. New gradient layers are inserted and the
	 * old layers fade out, creating a cross-fade effect.
	 *
	 * @param {Object} props - Properties object.
	 * @param {JSX.Element | Array<JSX.Element>} props.children - Components or elements to be rendered within the gradient.
	 * @param {Function} cleanup - Cleanup function to manage component lifecycle and avoid memory leaks.
	 *
	 * @returns {JSX.Element} A JSX element that contains the gradient layers and content.
	 */
	const Gradient = ({ children }, cleanup) => {
		const layers = OArray();
		const gradientCSSObs = theme('gradient').vars('gradientCSS');

		const makeLayer = (background) => ({
			background,
			opacity: Observer.mutable(1),
		});

		cleanup(gradientCSSObs.effect(newCSS => {
			if (!layers.length) {
				layers.push(makeLayer(newCSS));
				return;
			}

			const topLayer = layers[0];

			if (topLayer.background === newCSS) return;
			if (layers.length === 2) layers.pop();

			topLayer.opacity.set(0);
			const oldTop = topLayer;

			setTimeout(() => {
				const idx = layers.indexOf(oldTop);
				if (idx >= 0) {
					layers.splice(idx, 1);
				}
			}, 250);

			layers.unshift(makeLayer(newCSS));
		}));

		const Layer = ({ each: layer }) => <div
			theme="gradientLayer"
			style={{
				backgroundImage: layer.background,
				opacity: layer.opacity,
			}}
		/>;

		return <div theme="gradientOuter">
			<div theme="gradientFill">
				<Layer each={layers} />
			</div>
			<div theme="gradientContent">
				{children}
			</div>
		</div>;
	};

	return Gradient;
}));
