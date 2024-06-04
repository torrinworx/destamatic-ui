import h from './h';

import { OArray, Observer } from 'destam-dom';
import Theme from './Theme'

const useRipples = (background = Theme.colours.ripple.dark) => {
    const ripples = OArray();

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
