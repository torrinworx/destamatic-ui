import h from './h';

import { Observer } from 'destam-dom';
import { borderRadius, colours, outline, height, padding } from './Theme';

const Input = ({value, type='text', placeholder = '', style, ...props}) => {
    const isFocused = Observer.mutable(false)

    return <input
        $value={value}
        $type={type}
        $placeholder={placeholder}
        $oninput={e => value.set(e.target.value)}
		$onfocus={() => isFocused.set(true)}
		$onblur={() => isFocused.set(false)}
        $style={{
            ...style,
            minwidth: '100px',
            fontSize: '14px',
            padding: `0px ${padding} 0px ${padding}`,
            height: height,
            border: `${outline} ${colours.secondary.base}`,
            borderRadius: borderRadius,
            outline: isFocused.map(f => f ? `${outline} ${colours.primary.base}` : null)
        }}
        {...props}
    />
};

export default Input;
