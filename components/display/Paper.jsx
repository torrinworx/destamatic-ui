import { h } from '../utils/h';
import Theme from '../utils/Theme';

Theme.define({
    paper: {
        extends: 'radius',
        background: '$invert($color_top)',
        color: '$color_top',
        boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
        padding: 10,
        maxWidth: 'inherit',
        maxHeight: 'inherit',
        overflow: 'hidden',
    },
});

const Paper = ({ children, theme = "primary", type, tight, style, ...props }) => {
    return <div theme={[theme, "paper", type]} style={{
        padding: tight ? 0 : null,
        ...style,
    }}
        {...props}
    >
        {children}
    </div>;
};

export default Paper;
