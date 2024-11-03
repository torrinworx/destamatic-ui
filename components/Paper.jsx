import { h } from './h.jsx';
import Theme from './Theme';

Theme.define({
    paper: {
        extends: 'borderRadius',
        background: 'white',
        boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
        insetBoxShadow: 'inset -2px -2px 10px rgba(0,0,0,0.2)',
        padding: 10,
        maxWidth: 'inherit',
        maxHeight: 'inherit',
    },
});

const Paper = ({children, tight, style}) => {
    return <div theme="paper" style={{
        padding: tight ? 0 : null,
        ...style
    }}>
        {children}
    </div>;
};

export default Paper;
