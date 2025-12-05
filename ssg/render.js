import { mount } from 'destam-dom';
import {
    discoverStages,
    normalizeRouteToFolder,
    hasChildContextForStage,
} from './discovery';

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
        htmlEl.setAttribute('class', 'no-js');
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
 * Build route segments for each context from ctxKey/parentCtxKey chain.
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

// --- main render function ---

const render = (Root) => {
    const pages = [];

    const { bodyEl } = ensureDocumentSkeleton();

    // Initial mount
    mount(bodyEl, Root());

    console.log('SSG: ===== START RENDER PASS =====');

    // Run discovery; we snapshot the entire document each time
    const { contexts, pageHtmlByContextAndStage } = discoverStages(() => {
        return renderDocument();
    });

    const { segmentsByKey } = buildRoutes(contexts);

    for (const ctxInfo of contexts) {
        if (!ctxInfo.ssg) continue;

        const stageCtx = ctxInfo.stageRef;
        if (!stageCtx) continue;

        const allActs = Object.keys(stageCtx.acts || {});
        if (!allActs.length) continue;

        const routeSegments = segmentsByKey.get(ctxInfo.ctxKey) || [];
        const routeFolder = normalizeRouteToFolder(routeSegments);

        console.log(
            'SSG: render ctx',
            ctxInfo.ctxKey,
            'routeSegments=',
            routeSegments,
            'acts=',
            allActs,
        );

        for (const actName of allActs) {
            // Skip acts that are "parent routes" for child contexts
            if (hasChildContextForStage(contexts, ctxInfo, actName)) {
                console.log(
                    `  - skip act "${actName}" on ctx ${ctxInfo.ctxKey} because it has child context`,
                );
                continue;
            }

            const byAct = pageHtmlByContextAndStage.get(stageCtx);
            if (!byAct) {
                console.log('  - no HTML map for this stageCtx');
                continue;
            }

            const fullHtml = byAct.get(actName);
            if (!fullHtml) {
                console.log(`  - no HTML for act "${actName}"`);
                continue;
            }

            const isInitial = ctxInfo.initial && ctxInfo.initial === actName;
            const fileName = isInitial ? 'index' : actName;

            console.log(
                `  -> page route="${routeFolder}", file="${fileName}.html" from act="${actName}", html[0..200]=`,
                fullHtml.slice(0, 200).replace(/\n/g, '\\n'),
            );

            pages.push({
                route: routeFolder,
                name: fileName,
                html: fullHtml,
            });
        }
    }

    console.log('SSG: ===== END RENDER PASS =====');

    return pages;
};

export default render;
