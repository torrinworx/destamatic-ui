import h from './h';

import Button from './Button';
import Theme from './Theme';

const KebabMenu = ({state}, _, mount) => {
    // Close on reload
    mount((e) => {
        state._kebab = null
    })
  
    const kebab = state.observer.path('_kebab')

    // Close if not clicking kebab
    window.addEventListener('click', e => {
        if (!state._kebab) return;
        const coords = kebab.get().coords
        if (e.pageX !== coords[0] || e.pageY !== coords[1]){
            state._kebab = null
        }
    });

    const Item = ({ each: item }) => {
        return <Button label={item.label} style={{ width: '100%' }} onClick={item.onClick}/>
    }

    // Create menu where user clicked
    return kebab.map(kebab => kebab ?
    <div $style={{ position: 'absolute', left: `${kebab.coords[0]}px`, top: `${kebab.coords[1]}px`, zIndex: 2, 
        border: `1px solid ${Theme.colours.secondary.base}`, backgroundColor: 'white', borderRadius: Theme.borderRadius, display: 'flex', flexDirection: 'column' }}>
        <Item each={kebab.items} />
    </div> : null
    )
}

export default KebabMenu;