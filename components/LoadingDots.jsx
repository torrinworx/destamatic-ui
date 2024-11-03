import { h } from './h';
import Theme from './Theme';
import { mount } from 'destam-dom';

Theme.define({
    loadingDots: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingDots_dot: {
        extends: 'primary',

        background: '$color',
        display: 'inline-block',
        width: '8px',
        height: '8px',
        borderRadius: '50%',
        animationName: 'dotFlashing',
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'ease-in-out',
        margin: '20px 4px',
    },
});

/**
 * LoadingDots component - a loading indicator with three animated dots.
 * 
 * @returns {JSX.Element} The rendered loading dots component.
 */
const LoadingDots = ({style}) => {
    return <div theme='loadingDots' style={style}>
        <span theme='loadingDots_dot' style={{ animationDelay: '0s' }}></span>
        <span theme='loadingDots_dot' style={{ animationDelay: '.2s' }}></span>
        <span theme='loadingDots_dot' style={{ animationDelay: '.4s' }}></span>
    </div>;
};

export default LoadingDots;
