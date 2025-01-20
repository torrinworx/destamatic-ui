import { Observer } from "destam-dom";

import Button from "../inputs/Button";
import Icon from '../display/Icon';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import useAbort from '../../util/abort';

Theme.define({
    drawer: {
        outlineColor: '$color',
        outlineWidth: 1,
        outlineStyle: 'solid',

        height: '100%',
        padding: '10px',
        overflowY: 'hidden',
    },
});

export default ThemeContext.use(h => {
    const Drawer = ({ children, type, open, style, ...props }, cleanup) => {
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

        cleanup(useAbort(abort => window.addEventListener('resize', handleResize, {abort})));

        return <div
            style={{
                height: '100%',
            }}
            {...props}
        >
            <div
                style={{
                    height: '100%',
                    transition: resizing.map(r => r ? 'none' : 'width 0.3s ease-in-out'),
                    width: open.map(o => o ? width : '0px'),
                }}
            >
                <div
                    style={{
                        width: width,
                        height: '100%',
                        transition: resizing.map(r => r ? 'none' : 'transform 0.3s ease-in-out'),
                        transform: open.map(o => o ? 'translateX(0)' : `translateX(-${width})`),
                        overflow: 'auto',
                    }}
                >
                    <div theme={['drawer', type]} style={style}>
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
    };

    return Drawer;
});
