import { Observer } from "destam-dom";

import Theme from '../utils/Theme';

Theme.define({
	gradientWrapper: {
		position: "relative",
		zIndex: 0,
		minHeight: "100vh"
	},
	gradientCurrent: {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		transition: "opacity 250ms ease-in-out",
		zIndex: -1,
	},
	gradientNext: {
		position: "fixed",
		top: 0,
		left: 0,
		right: 0,
		bottom: 0,
		zIndex: -2,
	},
});

export default Theme.use(theme => {
	const Gradient = ({ children }, _, cleanup) => {
		const primaryColor = theme('primary').vars('color');
		const secondaryColor = theme('secondary').vars('color');

		const gradient = Observer.all([primaryColor, secondaryColor]).map(([p, s]) => {
			return `linear-gradient(to top right, ${p}, ${s}, ${s})`;
		});

		const currentGradient = Observer.mutable(gradient.get());
		const nextGradient = Observer.mutable(gradient.get());
		const opacityTop = Observer.mutable(1);

		cleanup(() => gradient.effect(() => {
			// If transition already running, immediately update for new target
			let ongoingTransition = opacityTop.get() < 1;
			nextGradient.set(gradient.get());

			// Start transition only if not ongoing
			if (!ongoingTransition) {
				opacityTop.set(0);

				setTimeout(() => {
					currentGradient.set(nextGradient.get());
					opacityTop.set(1);
				}, 250);
			}
		}));

		return <div theme='gradientWrapper'>
			<div
				theme='gradientCurrent'
				style={{
					backgroundImage: currentGradient,
					opacity: opacityTop,
				}}
			/>
			<div
				theme='gradientNext'
				style={{
					backgroundImage: nextGradient,
				}}
			/>
			{children}
		</div>;
	};

	return Gradient;
});
