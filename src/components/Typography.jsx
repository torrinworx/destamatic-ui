import { h } from 'destam-dom';

import Shared from './Shared';

const Typography = ({ variant, children, style, ...props }) => {
    return <div
        $style={{
            ...style,
            ...Shared.Theme.Typography[variant]
        }}
        {...props}
    >
        {children}
    </div>;
};

export default Typography;
