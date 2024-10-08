import { h } from './h';

import { OArray, Observer } from 'destam-dom';
import Theme from './Theme';

/**
 * Custom hook for creating ripple effects.
 * 
 * @param {string} [background=Shared.Theme.Colours.ripple.dark] - The background color of the ripple effect.
 * 
 * @returns {[Array<JSX.Element>, Function]} - Returns a tuple where the first element is the array of ripple elements and the second is the function to create a ripple.
 */
const useRipples = background => {
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
        const radius = diameter / 2;

        const rippleX = event.clientX - rect.left;
        const rippleY = event.clientY - rect.top;

        const opacity = Observer.mutable(1);
        const scale = Observer.mutable(0);

        ripples.push(<span
            $style={{
                position: 'absolute',
                borderRadius: '50%',
                width: diameter + 'px',
                height: diameter + 'px',
                top: rippleY + 'px',
                left: rippleX + 'px',
                background: background,
                transform: scale.map(scale => `translate(-50%, -50%) scale(${scale})`),
                opacity: opacity,
                transition: 'transform 0.8s, opacity 0.8s',
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
