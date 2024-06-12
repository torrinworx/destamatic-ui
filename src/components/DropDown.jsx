import h from './h';
import Shown from './Shown';

import { Observer } from 'destam-dom';
import Icon from './Icon';

const DropDown = ({ children, label, arrow = 'right' }) => {
    const isDropedDown = Observer.mutable(false)

    const toggle = () => isDropedDown.set(!isDropedDown.get())

    return <div>
        <div $style={{ display: 'flex', alignItems: 'center', justifyContent: arrow === 'right' ? 'space-between' : 'flex-start' }} $onclick={toggle}>
            {arrow === 'right' ? label : null}
            <div $style={{ display: 'flex', alignItems: 'center' }}>
                <i $class='chevron-icon' $style={{ cursor: 'pointer' }}>
                    {isDropedDown.map((show) => show ?
                        <Icon size='20' libraryName='feather' iconName='chevron-down' /> :
                        <Icon size='20' libraryName='feather' iconName='chevron-right' />)}
                </i>
            </div>
            {arrow === 'left' ? label : null}
        </div>
        <Shown value={isDropedDown} children={children} />
    </div>
}

export default DropDown;
