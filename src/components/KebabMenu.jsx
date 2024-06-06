import h from './h';
import { Observer } from 'destam-dom';

import Button from './Button';
import Shown from './Shown';
import Theme from './Theme';

const KebabMenu = ({value, items}, cleanup) => {

    if (!value) {
        value = Observer.mutable(false);
    };

    const closeKebab = e => {
        const coords = value.get();
        if (e.pageX !== coords?.[0] || e.pageY !== coords?.[1]){
            value.set();
        }
    }

    // Close if not clicking kebab
    window.addEventListener('click', closeKebab);
    cleanup(() => window.removeEventListener('click', closeKebab));

    const Item = ({ each: item }) => {
        return <Button label={item.label} style={{ width: '100%' }} onClick={item.onClick}/>
    }

    // Create menu where user clicked
    return <Shown value={value}>
        <div $style={{
            position: 'absolute',
            left: value.map(value => value?.[0] + 'px'),
            top: value.map(value => value?.[1] + 'px'),
            zIndex: 2, 
            border: `1px solid ${Theme.colours.secondary.base}`,
            backgroundColor: 'white',
            borderRadius: Theme.borderRadius,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <Item each={items} />
        </div>
    </Shown>
}

export default KebabMenu;