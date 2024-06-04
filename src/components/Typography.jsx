import { h } from 'destam-dom';

import Theme from './Theme';

const Typography = ({ variant, bold, children, style, ...props }) => {
    const getTypographyStyle = () => {
        const typographyStyles = Theme.typography[variant];
        if (bold && typographyStyles.bold) {
            return typographyStyles.bold;
        }
        return typographyStyles.regular || '';
    };

    return (
        <div
            $style={{
                ...style,
                font: getTypographyStyle(),
            }}
            {...props}
        >
            {children}
        </div>
    );
};

export default Typography;
