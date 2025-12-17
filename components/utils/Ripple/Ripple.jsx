import { h } from './h.jsx';

import { OArray, Observer } from 'destam-dom';
import Theme from './Theme.jsx';

Theme.define({
    ripple: {
        extends: 'primary',
        pointerEvents: 'none',
        background: '$alpha($color_top, .3)',
        position: 'absolute',
        borderRadius: '50%',
        transition: 'transform 0.8s, opacity 0.8s',
    },
});

/**
 * Custom hook for creating ripple effects.
 */
const useRipples = () => {
    const ripples = OArray();

    /**
     * Creates a ripple effect at the location of the click event.
     * 
     * @param {MouseEvent} event - The click event triggering the ripple.
     */
    const createRipple = (event) => {
		let elem = event;
		if (!(elem instanceof Node)) {
			elem = elem.currentTarget;
		}

        const rect = elem.getBoundingClientRect();
        const diameter = Math.max(rect.width, rect.height);

        const rippleX = event.clientX - rect.left;
        const rippleY = event.clientY - rect.top;

        const opacity = Observer.mutable(1);
        const scale = Observer.mutable(0);

        ripples.push(<span
            theme="ripple"
            style={{
                width: diameter,
                height: diameter,
                top: rippleY,
                left: rippleX,
                transform: scale.map(scale => `translate(-50%, -50%) scale(${scale})`),
                opacity: opacity,
            }}
        />);

        requestAnimationFrame(() => requestAnimationFrame(() => {
            opacity.set(0);
            scale.set(4);

            setTimeout(() => {
                ripples.splice(0, 1);
            }, 800); // Clean up the ripple after the animation
        }));
    };

    return [ripples, createRipple];
};

export default useRipples;
