import createContext from '../Context/Context.jsx';

const isObj = v => v && typeof v === 'object';
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const handlerNameFor = type => 'on' + cap(type);

const merge = (raw, parent) => {
    const p = isObj(parent) ? parent : {};
    const r = isObj(raw) ? raw : {};

    // merge meta a bit nicer than a raw spread
    return {
        ...p,
        ...r,
        meta: {
            ...(isObj(p.meta) ? p.meta : {}),
            ...(isObj(r.meta) ? r.meta : {}),
        }
    };
};

const InputContext = createContext(null, merge);

/**
 * Fire an input event into the context.
 * - calls ctx.on(payload) first (generic)
 * - then calls ctx.onClick / ctx.onSlide / etc (specific)
 */
InputContext.fire = (ctx, type, payload) => {
    if (!ctx) return;

    const specificName = handlerNameFor(type);

    payload = {
        type,
        ...((ctx && ctx.meta) || {}),
        ...payload,
    };

    if (typeof ctx.on === 'function') ctx.on(payload);

    const specific = ctx[specificName];
    if (typeof specific === 'function') specific(payload);
};

export default InputContext;
