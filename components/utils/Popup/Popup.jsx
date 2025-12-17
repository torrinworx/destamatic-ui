import { OArray, Observer } from 'destam-dom';

import { h } from '../h/h.jsx';
import createContext from '../Context/Context.jsx';
import ThemeContext from '../ThemeContext/ThemeContext.jsx';

import useAbort from '../../../util/abort.js';

const RawContext = createContext();

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
const Popup = ThemeContext.use(h => RawContext.use(context => ({ children, style, placement, canClose }, cleanup) => {
    if (!context) throw new Error("No popup context");
    if (!(placement instanceof Observer)) placement = Observer.immutable(placement);

    const ref = Observer.mutable(null);

    const getter = (name, scale) => {
        if (scale) {
            return Observer.all([placement, Observer.immutable(scale)]).map(([obj, scale]) => {
                if (obj?.[name] !== undefined) return obj[name] / scale;
                return undefined;
            });
        } else {
            return placement.map(obj => {
                if (obj?.[name] !== undefined) return obj[name];
                return undefined;
            });
        }
    };

    const dom = <div ref={ref} style={{
        position: 'absolute',
        left: getter('left'),
        top: getter('top'),
        right: getter('right'),
        bottom: getter('bottom'),
        maxWidth: getter('maxWidth', context.scale),
        maxHeight: getter('maxHeight', context.scale),
        transformOrigin: getter('transformOrigin'),
        width: 'max-content',
        height: 'max-content',
        ...context.style,
        ...style
    }}>
        {children}
    </div>;

    // assign the actual dom node to the element. Sometimes it's useful to get the
    // dom node from a list of popups
    dom.elem = ref.get();

    if (!placement.isImmutable()) {
        cleanup(useAbort(abort => document.body.addEventListener('mousedown', e => {
            let target = e.target;
            let found = false;
            while (target) {
                if (target === ref.get()) {
                    found = true;
                    break;
                }
                target = target.parentElement;
            }

            if (!found && (!canClose || canClose(e))) {
                placement.set(null);
            }
        }, {abort}))());
    }

    context.popups.push(dom);

    cleanup(() => {
        const index = context.popups.indexOf(dom);
        if (index >= 0) context.popups.splice(index, 1);
    });

    return null;
}));

export const PopupContext = ({children, popups, ...stuff}) => {
    if (!popups) popups = OArray();

    return <RawContext value={{popups, ...stuff}}>
        {children}
        {popups}
    </RawContext>;
};

export default Popup;
