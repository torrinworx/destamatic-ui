import { h } from './h.jsx';
import Theme from './Theme';

Theme.define({
    paper: {
        extends: 'radius',
        background: '$color_top',
        color: '$color_text',
        boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
        padding: 10,
        maxWidth: 'inherit',
        maxHeight: 'inherit',
        overflow: 'hidden',
    },
});

const Paper = ({children, theme, tight, style}) => {
    return <div theme={["primary", theme, "paper"]} style={{
        padding: tight ? 0 : null,
        ...style
    }}>
        {children}
    </div>;
};

export default Paper;
