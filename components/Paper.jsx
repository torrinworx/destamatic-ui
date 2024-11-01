import { h } from './h.jsx';

const Paper = ({children, tight, style}) => {
    return <div theme="paper" style={{
        padding: tight ? 0 : null,
        ...style
    }}>
        {children}
    </div>;
};

export default Paper;
