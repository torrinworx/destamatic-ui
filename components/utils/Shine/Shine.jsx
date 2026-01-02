// utils/Shine/Shine.jsx (or wherever you keep these hooks)
import { OArray, Observer } from 'destam-dom';
import { h } from '../h/h.jsx';
import Theme from '../Theme/Theme.jsx';

Theme.define({
	shine: {
		extends: 'primary',
		pointerEvents: 'none',
		position: 'absolute',
		top: 0,
		left: 0,

		// cover the whole parent and a bit extra horizontally
		width: '200%',
		height: '100%',

		// this is the shiny bar, angled
		background:
			'linear-gradient(120deg,' +
			'rgba(255,255,255,0) 0%,' +
			'rgba(255,255,255,0) 35%,' +
			'rgba(255,255,255,0.7) 50%,' +
			'rgba(255,255,255,0) 65%,' +
			'rgba(255,255,255,0) 100%)',

		borderRadius: 'inherit',
		mixBlendMode: 'screen',

		// we animate via Observer changes, but CSS handles the easing
		transition: 'transform 0.8s ease-out, opacity 0.8s ease-out',
	},
});

/**
 * Like useRipples, but for a single “shhhhling” shine pass.
 *
 * Usage:
 *   const [shines, createShine] = useShine();
 *   ...
 *   <div style={{ position:'relative', overflow:'hidden' }}>
 *     {shines}
 *     ...content...
 *   </div>
 */
const useShine = () => {
	const shines = OArray();

	const createShine = (_eventOrElem) => {
		const offset = Observer.mutable(-150); // in %, start far left
		const opacity = Observer.mutable(0.9);

		shines.push(
			<span
				theme="shine"
				style={{
					transform: offset.map(
						o => `translateX(${o}%) skewX(-20deg)`
					),
					opacity,
				}}
			/>,
		);

		// two RAFs like ripple to ensure initial styles are committed
		requestAnimationFrame(() =>
			requestAnimationFrame(() => {
				// animate across to the right and fade out
				offset.set(150);
				opacity.set(0);

				// clean up after transition
				setTimeout(() => {
					shines.splice(0, 1);
				}, 800);
			}),
		);
	};

	return [shines, createShine];
};

export default useShine;