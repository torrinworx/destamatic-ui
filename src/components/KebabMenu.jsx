import h from './h';
import { Observer } from 'destam-dom';

import Shown from './Shown';
import Popup from './Popup';
import Button from './Button';

import IconComponent from './Icon';

const KebabMenu = ({Icon, children, anchor}) => {
    if (!Icon) {
        Icon = <IconComponent libraryName='feather' iconName='more-vertical' />
    }

    const shown = Observer.mutable(false);
    const ref = <div />;
    const button = <div />;

    // Close if not clicking kebab
    const close = e => {
        let current = e.target;
        while (current && current !== ref){
            current = current.parentElement;
        }
        if (!current) shown.set(false);
    };

    // Listen for click events only when mounted
    const ClickHandler = ({}, cleanup, mount) => {
        mount(() => {
            setTimeout(() => {
                window.addEventListener('click', close);
            }, 0);
        });
        cleanup(() => window.removeEventListener('click', close));

        return null;
    };

    return <>
        <Button Icon={Icon} ref={button} onClick={e => {
            if (shown.get()) {
                shown.set(false);
            } else {
                let bounds = button.getBoundingClientRect();

                switch (anchor) {
                case 'up-right':
                    shown.set({left: bounds.left, bottom: window.innerHeight - bounds.bottom + bounds.height});
                    break;
                case 'down-left':
                    shown.set({right: window.innerWidth - bounds.right, top: bounds.bottom});
                    break;
                default:
                    shown.set({left: bounds.left, top: bounds.bottom});
                }

            }
        }} />
        <Shown value={shown}>
            <ClickHandler />
            <Popup placement={shown} ref={ref}>{children}</Popup>
        </Shown>
    </>;
};

export default KebabMenu;
