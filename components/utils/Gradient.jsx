import { h } from '../utils/h';
import { OArray, Observer } from 'destam-dom';
import { atomic } from 'destam/Network';
import Theme from '../utils/Theme';

Theme.define({
	gradientOuter: {
		position: "relative",
		width: "100%",
		height: "100%",
	},
	gradientFill: {
		// The background "sheet" 100% of the screen, behind content
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		pointerEvents: "none",
	},
	gradientLayer: {
		// Each layer crossfades via opacity, with no zIndex needed
		position: "absolute",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		transition: "opacity 250ms ease-in-out",
	},
	gradientContent: {
		// The visible user content is also fixed, 
		// painted after the background in the DOM => on top
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		overflowY: "auto",
		overflowX: "hidden",
	},
});

export default Theme.use(theme => {
	const Gradient = ({ children }, cleanup) => {
		// Keep an OArray of background layers for crossfades
		const layers = OArray();

		// Colors from theme:
		const primaryColor = theme('primary').vars('color');
		const secondaryColor = theme('secondary').vars('color');
		const gradient = Observer.all([primaryColor, secondaryColor]).map(([p, s]) =>
			`linear-gradient(to top right, ${p}, ${s}, ${s})`
		);

		// Helper to build a new topmost layer:
		const makeLayer = bg => ({
			background: bg,
			opacity: Observer.mutable(1),
		});

		// On first mount or when gradient changes, add a new layer and fade out the old top:
		cleanup(gradient.effect((bg, oldVal) => {
			if (!layers.length) {
				// first layer
				atomic(() => layers.unshift(makeLayer(bg)));
				return;
			}
			if (bg === oldVal) return;

			// Add new behind everything:
			atomic(() => layers.unshift(makeLayer(bg)));

			// Fade out old top layer:
			const oldTop = layers[layers.length - 1];
			oldTop.opacity.set(0);

			// Remove it after the transition:
			setTimeout(() => {
				const idx = layers.indexOf(oldTop);
				if (idx >= 0) atomic(() => layers.splice(idx, 1));
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
});
