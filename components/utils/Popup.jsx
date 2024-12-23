import { h } from './h';
import { OArray, Observer } from 'destam-dom';

/**
 * Global array to hold active popup components.
 * 
 * @type {Array<JSX.Element>}
 */
export const popups = OArray();

/**
 * Popup component that positions its children absolutely based on the given placement.
 * The placement is observed continuously for changes.
 * 
 * @param {Object} props - The properties object.
 * @param {JSX.Element | Array<JSX.Element>} props.children - The content to be displayed within the popup.
 * @param {Object} [props.style] - Custom styles to be applied to the popup container.
 * @param {Observer<Object>|Object} props.placement - An object or observable that determines the absolute position of the popup.
 * @param {HTMLElement} [props.ref] - A reference to the DOM element of the popup.
 * @param {Function} cleanup - A function to handle cleanup when the popup is removed.
 * 
 * @returns {null} The popup component does not return a DOM element directly; it sets up an element in the global `popups` array.
 */
const Popup = ({ children, style, placement, ref: Ref }, cleanup, mounted) => {
    if (!Ref) Ref = <raw:div />;
    if (!(placement instanceof Observer)) placement = Observer.immutable(placement);

    const getter = (obj, name) => {
        if (obj?.[name] !== undefined) return obj[name];
        return undefined;
    };

    const dom = <Ref style={{
        position: 'absolute',
        left: placement.map(p => getter(p, 'left')),
        top: placement.map(p => getter(p, 'top')),
        right: placement.map(p => getter(p, 'right')),
        bottom: placement.map(p => getter(p, 'bottom')),
        maxWidth: placement.map(p => getter(p, 'maxWidth')),
        maxHeight: placement.map(p => getter(p, 'maxHeight')),
        ...style
    }}>
        {children}
    </Ref>;

    let listener;
    if (!placement.isImmutable()) {
        listener = (e) => {
            let target = e.target;
            let found = false;
            while (target) {
                if (target === Ref) {
                    found = true;
                    break;
                }
                target = target.parentElement;
            }

            if (!found) {
                placement.set(null);
            }
        };

        mounted(() => {
            setTimeout(() => {
                document.body.addEventListener('mousedown', listener);
            }, 0);
        });
    }

    popups.push(dom);

    cleanup(() => {
        const index = popups.indexOf(dom);
        if (index >= 0) popups.splice(index, 1);

        if (listener) {
            document.body.removeEventListener('mousedown', listener);
        }
    });

    return null;
};

export default Popup;
