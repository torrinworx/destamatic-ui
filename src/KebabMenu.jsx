import { h } from './h';
import { Observer } from 'destam-dom';

import Shown from './Shown';
import Popup from './Popup';
import Button from './Button';

import IconComponent from './Icon';
import Detached from './Detached';

const KebabMenu = ({
    Icon,
    shown,
    children,
    ...props
}) => {
    if (!(shown instanceof Observer)) shown = Observer.mutable(false);

    if (!Icon) {
        Icon = <IconComponent libraryName='feather' iconName='more-vertical' />
    }

    return <Detached
        enabled={shown}
        menu={Icon}
        {...props}
    >
        {children}
    </Detached>;
};

export default KebabMenu;
