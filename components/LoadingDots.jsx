import { h } from './h';
import Theme from './Theme';
import { mount } from 'destam-dom';

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
