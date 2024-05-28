import h from '../h';

import { Observer } from "destam-dom";

import Button from "../Button";
import Icon from '../Icon';
import { colours, borderRadius, boxShadow, height } from '../Theme';


const Drawer = ({ children, open, ...props }) => {
    const width = '25vw';
    if (!open) {
        open = Observer.mutable(false);
    }

    // TODO: Need to make sure the width ease/transform thingy isn't applied when the screen is getting
    // resized by the user because it looks weird.

    return <div
        $style={{
            height: '100%',
            boxSizing: 'border-box',
        }}
    >
        <div
            $style={{
                height: '100%',
                boxSizing: 'border-box',
                transition: 'width 0.3s ease-in-out',
                width: open.map(o => o ? width : '0px'),
            }}
        >
            <div
                $style={{
                    width: width,
                    height: '100%',
                    boxSizing: 'border-box',
                    transition: 'transform 0.3s ease-in-out',
                    transform: open.map(o => o ? 'translateX(0)' : `translateX(-${width})`),
                    overflow: 'auto',
                }}
            >
                <div $style={{ boxSizing: 'border-box', padding: '20px', height: '100%'}}>
                    <div $style={{
                        boxShadow: boxShadow,
                        borderRadius: borderRadius,
                        boxSizing: 'border-box',
                        border: `1px solid ${colours.secondary.base}`,
                        height: '100%',
                        padding: '10px',
                        overflowY: 'hidden'
                    }}>
                        {children}
                    </div>
                </div>
            </div>
        </div>
        <Button
            onClick={() => open.set(!open.get())}
            $style={{
                position: 'absolute',
                transition: 'transform 0.3s ease-in-out',
                top: '50%',
                left: '0',
                transform: open.map(o => `translateX(${o ? width : '0px'}) translateY(-100%)`),
                zIndex: 1, // Ensure the button is always clickable
            }}
            Icon={open.map(
                o => o ? <Icon libraryName={'feather'} iconName={'chevron-left'} />
                    : <Icon libraryName={'feather'} iconName={'chevron-right'} />
            )}
        />
    </div>
};

export default Drawer;
