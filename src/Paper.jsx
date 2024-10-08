import { h } from './h.jsx';

const Paper = ({children, tight, style}) => {
    return <div style={{
        borderRadius: '5px',
        background: 'white',
        boxShadow: '4px 4px 10px rgba(0,0,0,0.2)',
        insetBoxShadow: 'inset -2px -2px 10px rgba(0,0,0,0.2)',
        padding: tight ? 0 : 10,
        maxWidth: 'inherit',
        maxHeight: 'inherit',
        ...style
    }}>
        {children}
    </div>;
};

export default Paper;
