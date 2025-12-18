import { UUID } from 'destam';
import { mount, OArray } from 'destam-dom';
import createContext from '../../utils/Context/Context.jsx';
import {h} from '../../utils/h/h.jsx';

const rendered = OArray([]);
const groups = new Map();
let groupOrderSeq = 0;
let writeSeq = 0;

let headMounted = false;

const ensureHeadMounted = () => {
    if (headMounted) return;
    headMounted = true;

    if (typeof document === 'undefined' || !document.head) return;

    const HeadRender = ({ each }) => each.node;
    mount(document.head, <HeadRender each={rendered} />);
};

const getGroupState = (group) => {
    let st = groups.get(group);
    if (!st) {
        st = { entries: new Map(), order: ++groupOrderSeq };
        groups.set(group, st);
    }
    return st;
};

const pickWinner = (st) => {
    let best = null;

    for (const entry of st.entries.values()) {
        if (!best) {
            best = entry;
            continue;
        }

        if (entry.depth > best.depth) best = entry;
        else if (entry.depth === best.depth && entry.seq > best.seq) best = entry;
    }

    return best;
};

const setRenderedWinner = (group, winner) => {
    const idx = rendered.findIndex(e => e.group === group);

    if (!winner) {
        if (idx >= 0) rendered.splice(idx, 1);
        return;
    }

    const next = { group, id: winner.id, node: winner.node };

    if (idx >= 0) rendered.splice(idx, 1, next);
    else rendered.push(next);
};

const recomputeGroup = (group) => {
    const st = groups.get(group);
    if (!st) return;

    const winner = pickWinner(st);
    setRenderedWinner(group, winner);

    if (st.entries.size === 0) {
        groups.delete(group);
    }
};

const register = ({ group, node, depth }) => {
    ensureHeadMounted();

    if (!node) {
        throw new Error(`Head.register: "node" is required (group="${group}")`);
    }

    const id = UUID().toHex();
    const st = getGroupState(group);

    const entry = {
        id,
        group,
        node,
        depth,
        seq: ++writeSeq,
    };

    st.entries.set(id, entry);
    recomputeGroup(group);

    return () => {
        const st2 = groups.get(group);
        if (!st2) return;

        st2.entries.delete(id);
        recomputeGroup(group);
    };
};

const createApi = (depth) => {
    return {
        depth,
        add(node, opts = {}) {
            const group = opts.group ?? `__anon:${UUID().toHex()}`;
            return register({ group, node, depth });
        },
        addUnique(group, node) {
            if (!group) throw new Error('Head.addUnique(group, node) requires a group');
            return register({ group, node, depth });
        },
    };
};

const baseApi = createApi(-1);

export const HeadContext = createContext(
    baseApi,
    (raw, parentApi) => {
        const parentDepth = parentApi?.depth ?? -1;
        const api = createApi(parentDepth + 1);

        if (typeof raw === 'function') {
            return raw(api, parentApi) || api;
        }

        if (raw && typeof raw === 'object') {
            return { ...api, ...raw };
        }

        return api;
    }
);

export const Head = ({ value, children }, cleanup, mounted) => {
    ensureHeadMounted();

    return (elem, _, before, context) => {
        return HeadContext({ value, children }, cleanup, mounted)(
            elem,
            _,
            before,
            context
        );
    };
};
