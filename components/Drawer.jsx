import { h } from './h';

import { Observer } from "destam-dom";

import Button from "./Button";
import Icon from './Icon';
import Theme from './Theme';

const Drawer = Theme.use(theme => ({ children, open, style, ...props }, cleanup) => {
    const width = '25vw';
    if (!open) {
        open = Observer.mutable(false);
    }

    const resizing = Observer.mutable(false);
    let resizeTimeout;

    // Event handler to disable transitions during resize
    const handleResize = () => {
        resizing.set(true);
        clearTimeout(resizeTimeout);
        resizeTimeout = setTimeout(() => {
            resizing.set(false);
        }, 200);  // Adjust the timeout as needed
    };

    window.addEventListener('resize', handleResize);

    // Cleanup resize event listener when the component unmounts
    cleanup(() => window.removeEventListener('resize', handleResize));

    return <div
        $style={{
            height: '100%',
            boxSizing: 'border-box',
        }}
        {...props}
    >
        <div
            $style={{
                height: '100%',
                boxSizing: 'border-box',
                transition: resizing.map(r => r ? 'none' : 'width 0.3s ease-in-out'),
                width: open.map(o => o ? width : '0px'),
            }}
        >
            <div
                $style={{
                    width: width,
                    height: '100%',
                    boxSizing: 'border-box',
                    transition: resizing.map(r => r ? 'none' : 'transform 0.3s ease-in-out'),
                    transform: open.map(o => o ? 'translateX(0)' : `translateX(-${width})`),
                    overflow: 'auto',
                }}
            >
                    <div $style={{
                        boxSizing: 'border-box',
                        border: `1px solid ${theme.Colours.secondary.base}`,
                        height: '100%',
                        padding: '10px',
                        overflowY: 'hidden',
                        ...style
                    }}>
                        {children}
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
            }}
            Icon={open.map(
                o => o ? <Icon libraryName={'feather'} iconName={'chevron-left'} />
                    : <Icon libraryName={'feather'} iconName={'chevron-right'} />
            )}
        />
    </div>
});

export default Drawer;