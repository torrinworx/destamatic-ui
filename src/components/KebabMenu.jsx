import h from './h';
import { Observer } from 'destam-dom';

import Button from './Button';
import Shown from './Shown';
import Theme from './Theme';

const KebabMenu = ({value, items, closeOnClick = true}, cleanup, mount) => {

    if (!value) {
        value = Observer.mutable(false);
    };

    const Div = <div />;

    // Close if not clicking kebab
    const close = e => {
        if (!value.get() || e.pageX === value.get().x || e.pageY === value.get().y) return
        let current = e.target;
        while (current && current !==  Div){
            current = current.parentElement;
        }
        if (!current) value.set(false);
    }

    const Item = ({ each: item }) => {
        return <Button label={item.label} style={{ width: '100%' }} onClick={() => {
            if (closeOnClick) value.set(false)
            item.onClick()
        }}/>
    }

    // Listen for click events only when mounted
    const ClickHandler = ({}, cleanup, mount) => {
        mount(window.addEventListener('click', close));
        cleanup(() => window.removeEventListener('click', close));

        return null;
    }

    // Create menu where user clicked
    return <Shown value={value}>
        <Div $style={{
            position: 'absolute',
            left: value.map(value => value?.x + 'px'),
            top: value.map(value => value?.y + 'px'),
            zIndex: 2, 
            border: `1px solid ${Theme.colours.secondary.base}`,
            backgroundColor: 'white',
            borderRadius: Theme.borderRadius,
            display: 'flex',
            flexDirection: 'column'
        }}>
            <ClickHandler />
            <Item each={items} />
        </Div>
    </Shown>
}

export default KebabMenu;