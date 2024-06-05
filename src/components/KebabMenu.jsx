import h from './h';

import Button from './Button';
import Shown from './Shown';
import Theme from './Theme';

const KebabMenu = ({state}, cleanup) => {
    
    if (!state) {
        state = Observer.mutable(false);
    };

    const kebab = state.observer.path('_kebab')

    const closeKebab = e => {
        if (!state._kebab) return;
        const coords = kebab.get().coords
        if (e.pageX !== coords[0] || e.pageY !== coords[1]){
            state._kebab = null
        }
    }

    // Close if not clicking kebab
    window.addEventListener('click', closeKebab);
    cleanup(() => window.removeEventListener('click', closeKebab))

    const Item = ({ each: item }) => {
        return <Button label={item.label} style={{ width: '100%' }} onClick={item.onClick}/>
    }

    // Create menu where user clicked
    return <Shown value={kebab}>
        {kebab.map(kebab => {
            return <div $style={{
                position: 'absolute',
                left: `${kebab?.coords[0]}px`,
                top: `${kebab?.coords[1]}px`,
                zIndex: 2, 
                border: `1px solid ${Theme.colours.secondary.base}`,
                backgroundColor: 'white',
                borderRadius: Theme.borderRadius, display: 'flex',
                flexDirection: 'column'
            }}>
                <Item each={kebab?.items} />
            </div>
        })}
    </Shown>
}

export default KebabMenu;