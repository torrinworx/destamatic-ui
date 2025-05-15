import { OArray, Observer } from 'destam-dom';

import { h } from '../utils/h';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	gradient: {
		extends: 'primary',
		$gradientCSS: 'linear-gradient(to top right, $color, $color_top)',
	},

	gradientOuter: {
		position: 'relative',
		width: '100%', height: '100%',
	},
	gradientFill: {
		position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
		pointerEvents: 'none',
	},
	gradientLayer: {
		position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
		transition: 'opacity 250ms ease-in-out',
	},
	gradientContent: {
		position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
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

		// build new toplayer object:
		const makeLayer = (bg) => ({
			background: bg,
			opacity: Observer.mutable(1),
		});

		// watch for changes in gradientCSS and fade to a new layer
		cleanup(gradientCSSObs.effect((newCSS) => {
			if (!layers.length) {
				layers.unshift(makeLayer(newCSS));
				return;
			}

			const currentTopLayer = layers[0];
			if (newCSS === currentTopLayer.background) return;

			layers.unshift(makeLayer(newCSS));

			// Fade out old top
			const oldTop = layers[layers.length - 1];
			oldTop.opacity.set(0);

			// Remove after transition
			setTimeout(() => {
				const idx = layers.indexOf(oldTop);
				if (idx >= 0) layers.splice(idx, 1);
			}, 250);
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
