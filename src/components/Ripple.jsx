import h from './h';

import { OArray, Observer } from 'destam-dom';
import Shared from './Shared';

/**
 * Custom hook for creating ripple effects.
 * 
 * @param {string} [background=Shared.Theme.colours.ripple.dark] - The background color of the ripple effect.
 * 
 * @returns {[Array<JSX.Element>, Function]} - Returns a tuple where the first element is the array of ripple elements and the second is the function to create a ripple.
 */
const useRipples = (background = Shared.Theme.colours.ripple.dark) => {
    const ripples = OArray();

    /**
     * Creates a ripple effect at the location of the click event.
     * 
     * @param {MouseEvent} event - The click event triggering the ripple.
     */
    const createRipple = (event) => {
        const button = event.currentTarget;
        const diameter = Math.max(button.clientWidth, button.clientHeight);
        const radius = diameter / 2;
        const rect = button.getBoundingClientRect();

        const rippleX = event.clientX - rect.left - radius;
        const rippleY = event.clientY - rect.top - radius;

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
                transform: scale.map(scale => `scale(${scale})`),
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
