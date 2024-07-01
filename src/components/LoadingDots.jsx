import h from './h';
import Theme from './Theme';

/**
 * LoadingDots component - a loading indicator with three animated dots.
 * 
 * @returns {JSX.Element} The rendered loading dots component.
 */
const LoadingDots = () => {
    const dotStyle = {
        display: 'inline-block',
        width: '8px',
        height: '8px',
        backgroundColor: Theme.colours.primary.base,
        borderRadius: '50%',
        animationName: 'dotFlashing',
        animationDuration: '1s',
        animationIterationCount: 'infinite',
        animationTimingFunction: 'ease-in-out',
        margin: '20px 4px',
    };

    return <div $style={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <span $style={{ ...dotStyle, animationDelay: '0s' }}></span>
        <span $style={{ ...dotStyle, animationDelay: '.2s' }}></span>
        <span $style={{ ...dotStyle, animationDelay: '.4s' }}></span>
        <style>{`
            @keyframes dotFlashing {
                0%, 100% { opacity: 0; }
                50% { opacity: 1; }
            }
        `}</style>
    </div>;
};

export default LoadingDots;
