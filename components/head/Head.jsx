import { UUID } from 'destam';
import { mount, OArray, Observer } from 'destam-dom';
import createContext from '../utils/Context';

// All entries: { id, group?, node }
const headEntries = OArray();

// Derived view: only top entry per group
const visibleEntries = Observer.mutable([]);

// Recompute visible entries whenever headEntries changes
const recomputeVisible = () => {
    const byGroup = new Map();   // group -> entry
    const ungrouped = [];        // entries with no group

    for (const entry of headEntries) {
        if (entry.group) {
            // last one wins for that group
            byGroup.set(entry.group, entry);
        } else {
            // ungrouped entries just all show
            ungrouped.push(entry);
        }
    }

    const result = [...ungrouped, ...byGroup.values()];
    visibleEntries.set(result);
};

// Watch changes to headEntries reactively
headEntries.observer.watch(() => {
    recomputeVisible();
});

// Low-level helpers
const pushEntry = (entry) => {
    headEntries.push(entry);
    return () => {
        const idx = headEntries.findIndex(e => e.id === entry.id);
        if (idx >= 0) headEntries.splice(idx, 1);
    };
};

const clearAll = () => {
    headEntries.splice(0, headEntries.length);
};

// Base API (similar to what you already had, but adjust addUnique)
const createBaseApi = () => {
    const api = {
        add(node, opts = {}) {
            const { group } = opts;
            const id = UUID().toHex();
            return pushEntry({ id, group, node });
        },

        // Now addUnique is "ensure exactly one entry in this group from THIS call":
        // We do NOT clear others permanently; instead, we push and rely on stacking.
        addUnique(group, node) {
            const id = UUID().toHex();
            return pushEntry({ id, group, node });
        },

        push(node) {
            return api.add(node);
        },

        get(index) {
            return headEntries[index];
        },

        get length() {
            return headEntries.length;
        },

        get entries() {
            return headEntries;
        },

        // If you still want these raw operations, keep them:
        splice(start, deleteCount, ...items) {
            return headEntries.splice(start, deleteCount, ...items);
        },
        pop() { return headEntries.pop(); },
        shift() { return headEntries.shift(); },
        unshift(...items) { return headEntries.unshift(...items); },

        remove(id) {
            const idx = headEntries.findIndex(e => e.id === id);
            if (idx >= 0) headEntries.splice(idx, 1);
        },

        clear() {
            clearAll();
        },

        // Observe the raw list if needed:
        watch(listener, governor) {
            return headEntries.observer.watch(listener, governor);
        },
        effect(fn) {
            return headEntries.effect(fn);
        },
        map(fn) {
            return headEntries.map(fn);
        },
    };

    return api;
};

const baseApi = createBaseApi();

// HeadContext with same transform as you have now
export const HeadContext = createContext(
    baseApi,
    (next, prev) => {
        if (!next) return prev;

        if (typeof next === 'function') {
            return next(prev);
        }

        if (next && typeof next.add === 'function') {
            return {
                ...prev,
                ...next,
                add(node, opts) {
                    return next.add ? next.add(node, opts) : prev.add(node, opts);
                },
                addUnique(group, node) {
                    return next.addUnique
                        ? next.addUnique(group, node)
                        : prev.addUnique(group, node);
                },
            };
        }

        return prev;
    }
);

// We now render from visibleEntries, not headEntries
const HeadRender = ({ each }) => each.node

// Provider
export const Head = ({ value, children }, cleanup, mounted) => {
    if (!Head._mounted) {
        Head._mounted = true;
        mount(document.head, <HeadRender each={visibleEntries} />);
    }

    return (elem, _, before, context) => {
        return HeadContext({ value, children }, cleanup, mounted)(
            elem,
            _,
            before,
            context
        );
    };
};

// TODO: Somehow handle tags already in the dom if any are present before mount?
