import { mount } from 'destam-dom';
import {
    discoverStages,
    normalizeRouteToFolder,
    hasChildContextForStage,
} from './discovery.js';
import { suspendRegistry } from '../components/utils/Suspend/Suspend.jsx';

// --- async helpers ---

const waitForAllSuspendsToSettle = async () => {
    while (true) {
        const pending = [...suspendRegistry];
        if (!pending.length) break;
        await Promise.allSettled(pending);
    }
};

// --- HTML / DOM helpers ---

const escapeText = (text) =>
    String(text ?? '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');

const escapeAttr = (value) =>
    String(value ?? '')
        .replace(/&/g, '&amp;')
        .replace(/"/g, '&quot;');

/**
 * Serialize a single DOM node (element or text).
 */
const renderNode = (node) => {
    // Text node
    if (node.name === '') {
        return escapeText(node.textContent ?? node.textContent_ ?? '');
    }

    const tag = node.name;
    let attrs = '';

    // Attributes
    for (const [name, value] of Object.entries(node.attributes || {})) {
        if (value === '') attrs += ` ${name}`;
        else attrs += ` ${name}="${escapeAttr(value)}"`;
    }

    // Style
    const styleEntries = Object.entries(node.style || {});
    if (styleEntries.length) {
        const styleStr = styleEntries
            .map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => '-' + m.toLowerCase())}:${v}`)
            .join(';');
        attrs += ` style="${escapeAttr(styleStr)}"`;
    }

    const childrenHtml = (node.childNodes || []).map(renderNode).join('');
    return `<${tag}${attrs}>${childrenHtml}</${tag}>`;
};

/**
 * Serialize full document: <!doctype html><html>...</html>
 */
const renderDocument = () => {
    const doctype = '<!doctype html>';

    const htmlEl = document.documentElement;
    if (!htmlEl) {
        return `${doctype}<html><head></head><body></body></html>`;
    }

    // <html> attributes
    let htmlAttrs = '';
    for (const [name, value] of Object.entries(htmlEl.attributes || {})) {
        if (value === '') htmlAttrs += ` ${name}`;
        else htmlAttrs += ` ${name}="${escapeAttr(value)}"`;
    }

    const headEl = document.head;
    const bodyEl = document.body;

    const headHtml = headEl ? renderNode(headEl) : '<head></head>';
    const bodyHtml = bodyEl ? renderNode(bodyEl) : '<body></body>';

    return `${doctype}\n<html${htmlAttrs}>${headHtml}${bodyHtml}</html>`;
};

/**
 * Ensure we have documentElement, head, body.
 */
const ensureDocumentSkeleton = () => {
    // <html>
    let htmlEl = document.documentElement;
    if (!htmlEl) {
        htmlEl = document.createElement('html');
        document.documentElement = htmlEl;
    }

    if (!htmlEl.attributes?.lang) {
        htmlEl.setAttribute('lang', 'en');
    }
    if (!htmlEl.attributes?.class) {
        htmlEl.setAttribute('class', 'no-js preload');
    }

    // <head>
    let headEl = document.head;
    if (!headEl) {
        headEl = document.createElement('head');
        document.head = headEl;
    }

    // <body>
    let bodyEl = document.body;
    if (!bodyEl) {
        bodyEl = document.createElement('body');
        document.body = bodyEl;
    }

    // keep head/body as children of html
    if (!htmlEl.childNodes.includes(headEl)) {
        htmlEl.append(headEl);
    }
    if (!htmlEl.childNodes.includes(bodyEl)) {
        htmlEl.append(bodyEl);
    }

    return { htmlEl, headEl, bodyEl };
};

/**
 * Build route segments for each context from ctxKey / parentCtxKey chain.
 *
 * - Root contexts (parentCtxKey == null) -> []
 * - Child contexts -> parent segments + [parentRoute]
 */
const buildRoutes = (contexts) => {
    const byKey = new Map();
    const childrenByParent = new Map();

    for (const ctx of contexts) {
        byKey.set(ctx.ctxKey, ctx);
        const parent = ctx.parentCtxKey ?? null;
        if (!childrenByParent.has(parent)) childrenByParent.set(parent, []);
        childrenByParent.get(parent).push(ctx);
    }

    const segmentsByKey = new Map();

    const dfs = (ctx, parentSegments) => {
        let segs = parentSegments;
        if (ctx.parentRoute) {
            segs = [...parentSegments, ctx.parentRoute];
        }
        segmentsByKey.set(ctx.ctxKey, segs);

        const kids = childrenByParent.get(ctx.ctxKey) || [];
        for (const child of kids) {
            dfs(child, segs);
        }
    };

    const roots = childrenByParent.get(null) || [];
    for (const root of roots) {
        dfs(root, []);
    }

    return { segmentsByKey, byKey };
};

const findRootContext = (contexts) =>
    contexts.find((c) => c.parentCtxKey == null) || null;

/**
 * Build full Stage.open name-chain for a given context+act:
 * climb parents via parentCtxKey, collecting parentRoute (act on parent),
 * reverse to get root->ctx, then append actName (act on this ctx).
 */
const buildNameChainForContextAct = (contexts, ctxInfo, actName) => {
    const segments = [];
    let current = ctxInfo;

    while (current && current.parentCtxKey != null) {
        if (current.parentRoute) {
            segments.push(current.parentRoute);
        }
        current = contexts.find((c) => c.ctxKey === current.parentCtxKey) || null;
    }

    segments.reverse(); // root -> this ctx
    segments.push(actName);

    return segments;
};


const stageTreeMatchesChain = (rootStage, chain) => {
    let stage = rootStage;

    for (let i = 0; i < chain.length; i++) {
        const expectedAct = chain[i];
        if (!stage || stage.current !== expectedAct) {
            return false;
        }

        if (i < chain.length - 1) {
            // Move to the first child Stage for the next segment
            const child = stage.children && stage.children[0] && stage.children[0].value;
            stage = child || null;
        }
    }

    // OPTIONAL strictness: ensure no deeper acts are open beyond the chain
    // Uncomment if you want to enforce "exact path" vs "prefix path":
    /*
    let child = stage && stage.children && stage.children[0] && stage.children[0].value;
    if (child && child.current != null) {
        return false;
    }
    */

    return true;
};

const waitForRouteChain = (rootStage, chain) => {
    return new Promise((resolve) => {
        const { observer } = rootStage;

        let done = false;

        const check = () => {
            if (done) return;
            if (stageTreeMatchesChain(rootStage, chain)) {
                done = true;
                cleanupAll();
                resolve();
            }
        };

        // We want to re-check whenever *any* current in the chain changes.
        const cleanups = [];

        const cleanupAll = () => {
            for (const c of cleanups) c();
        };

        // 1) Watch root.current
        cleanups.push(
            observer
                .path('current')
                .effect(() => {
                    check();
                })
        );

        // 2) Watch all nested stage.current values:
        //    root.observer.tree('children').path('value').path('current')
        cleanups.push(
            observer
                .tree('children')
                .path('value')
                .path('current')
                .effect(() => {
                    check();
                })
        );

        // Do an initial check in case we're already at the correct state
        check();
    });
};

// --- main render function ---

const render = async (Root) => {
    const pages = [];
    const emitted = new Set(); // dedupe route+file

    const { bodyEl } = ensureDocumentSkeleton();

    // Mount app once
    mount(bodyEl, Root());

    console.log('SSG: ===== START RENDER PASS =====');

    // 1) Discover structure on this single app instance
    const { contexts } = await discoverStages();
    const { segmentsByKey } = buildRoutes(contexts);

    const rootCtx = findRootContext(contexts);
    if (!rootCtx || !rootCtx.stageRef) {
        console.warn('SSG: no root context; aborting');
        return pages;
    }
    const rootStage = rootCtx.stageRef;

    // 2) Build page definitions from structure
    const pageDefs = [];

    for (const ctxInfo of contexts) {
        if (!ctxInfo.ssg) continue;

        const stageCtx = ctxInfo.stageRef;
        if (!stageCtx) continue;

        const allActs = Object.keys(stageCtx.acts || {});
        if (!allActs.length) continue;

        const routeSegments = segmentsByKey.get(ctxInfo.ctxKey) || [];
        const routeFolder = normalizeRouteToFolder(routeSegments);

        for (const actName of allActs) {
            // Skip acts that are "parent routes" for child contexts
            if (hasChildContextForStage(contexts, ctxInfo, actName)) {
                continue;
            }

            const isInitial = ctxInfo.initial && ctxInfo.initial === actName;
            const fileName = isInitial ? 'index' : actName;

            const key = `${routeFolder}::${fileName}`;
            if (emitted.has(key)) continue;
            emitted.add(key);

            pageDefs.push({
                ctxInfo,
                actName,
                routeFolder,
                fileName,
            });
        }
    }

    // 3) For each page, drive routing via rootStage, wait, then snapshot
    for (const def of pageDefs) {
        const { ctxInfo, actName, routeFolder, fileName } = def;

        const chain = buildNameChainForContextAct(contexts, ctxInfo, actName);

        console.log(
            'SSG: render page',
            'ctx=', ctxInfo.ctxKey,
            'act=', actName,
            'chain=', chain,
            'routeFolder=', routeFolder,
            'file=', fileName,
        );

        // Drive routing
        rootStage.open({ name: [...chain], skipSignal: true });

        // 1) Wait until the stage tree configuration matches this chain
        await waitForRouteChain(rootStage, chain);

        // 2) Then wait until all active suspends have settled
        await waitForAllSuspendsToSettle();

        const fullHtml = renderDocument();

        console.log(
            `  -> snapshot route="${routeFolder}", file="${fileName}.html" html[0..200]=`,
            fullHtml.slice(0, 200).replace(/\n/g, '\\n'),
        );

        pages.push({
            route: routeFolder,
            name: fileName,
            html: fullHtml,
        });
    }

    console.log('SSG: ===== END RENDER PASS =====');

    return pages;
};

export default render;