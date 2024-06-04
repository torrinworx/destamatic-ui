import h from './h';

import { Observer } from 'destam-dom';
import Theme from './Theme';

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
            padding: `0px ${Theme.padding} 0px ${Theme.padding}`,
            height: Theme.height,
            border: `${Theme.outline} ${Theme.colours.secondary.base}`,
            borderRadius: Theme.borderRadius,
            outline: isFocused.map(f => f ? `${Theme.outline} ${Theme.colours.primary.base}` : null)
        }}
        {...props}
    />
};

export default Input;
