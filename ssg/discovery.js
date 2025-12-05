import { stageRegistry } from '../components/display/Stage';

/**
 * Open all acts of a stage context at least once
 * to force children to mount.
 */
const openAllActsOnce = (stageCtx) => {
    const stageNames = Object.keys(stageCtx.acts || {});
    for (const name of stageNames) {
        stageCtx.open({ name });
    }
};

/**
 * Core discovery loop: keep pulling new stage contexts
 * from stageRegistry until we've explored all of them.
 *
 * We key by the Stage object reference itself.
 */
const discoverAllStageContexts = (onExplored) => {
    const explored = new Set(); // of Stage objects
    let discoveredSomething = true;

    while (discoveredSomething) {
        discoveredSomething = false;

        const snapshot = Array.from(stageRegistry);

        for (const stageCtx of snapshot) {
            if (!stageCtx || explored.has(stageCtx)) continue;

            explored.add(stageCtx);
            discoveredSomething = true;

            openAllActsOnce(stageCtx);

            if (typeof onExplored === 'function') {
                onExplored(stageCtx);
            }
        }
    }
};

const makeStageKey = (stageCtx) => {
    const names = Object.keys(stageCtx.acts || {}).sort();
    return names.join(',');
};

/**
 * Snapshot all SSG-enabled stage contexts into a stable structure:
 * we generate a synthetic ctxKey instead of relying on stageCtx.id.
 */
const snapshotContexts = () => {
    const contexts = [];
    const seen = new Map(); // key: `${parentRoute}|${stagesKey}|${initial}`, value: ctxKey
    let counter = 0;

    for (const stageCtx of stageRegistry) {
        if (!stageCtx?.ssg) continue;

        const parentRoute = stageCtx.parentRoute || null;
        const stagesKey = makeStageKey(stageCtx);
        const initial = stageCtx.initial || null;
        const dedupeKey = `${parentRoute || 'ROOT'}|${stagesKey}|${initial || ''}`;

        let ctxKey = seen.get(dedupeKey);
        if (!ctxKey) {
            ctxKey = `ctx_${counter++}`;
            seen.set(dedupeKey, ctxKey);

            contexts.push({
                ctxKey,
                stageRef: stageCtx,
                parentRoute,
                initial,
                ssg: !!stageCtx.ssg,
            });
        }
    }

    return contexts;
};

/**
 * Build parent relationships between contexts based on parentRoute:
 *
 * Rule:
 * - A context C with parentRoute = X is considered a child of any context P
 *   whose acts include X.
 * - If multiple parents match, we just pick the first (it’s ambiguous otherwise).
 */
const buildParentLinks = (contexts) => {
    // map from actName -> array of parent contexts that have that act
    const parentsByActName = new Map();

    for (const ctx of contexts) {
        const acts = Object.keys(ctx.stageRef.acts || {});
        for (const act of acts) {
            if (!parentsByActName.has(act)) parentsByActName.set(act, []);
            parentsByActName.get(act).push(ctx);
        }
    }

    for (const ctx of contexts) {
        const route = ctx.parentRoute;
        if (!route) {
            ctx.parentCtxKey = null;
            continue;
        }

        const parents = parentsByActName.get(route) || [];
        // If there are multiple, just choose the first consistently.
        const parent = parents[0] || null;

        ctx.parentCtxKey = parent ? parent.ctxKey : null;
    }

    return contexts;
};

const normalizeRouteToFolder = (segments) => {
    if (!segments || segments.length === 0) return '/';
    const cleaned = segments.map(String).filter(Boolean);
    if (!cleaned.length) return '/';
    return '/' + cleaned.join('/') + '/';
};

/**
 * Given a parent context and an act name, check if any child context
 * is "hanging off" that act as parentRoute.
 */
const hasChildContextForStage = (contexts, parentCtx, stageName) => {
    const parentKey = parentCtx.ctxKey;
    for (const child of contexts) {
        if (child.parentCtxKey !== parentKey) continue;
        if (!child.parentRoute) continue;

        if (String(child.parentRoute).toLowerCase() === String(stageName).toLowerCase()) {
            return true;
        }
    }
    return false;
};

/**
 * Main discovery API.
 *
 * @param {Function} snapshotHtml - fn(stageCtx, stageName) => HTML string
 * @returns {{
 *   contexts: Array<{ ctxKey, stageRef, parentCtxKey, parentRoute, initial, ssg }>,
 *   pageHtmlByContextAndStage: Map<Stage, Map<string, string>>,
 * }}
 */
export const discoverStages = (snapshotHtml) => {
    // (Stage -> Map<actName, html>)
    const pageHtmlByContextAndStage = new Map();

    // 1) Explore all contexts and snapshot HTML per (stageRef, act)
    discoverAllStageContexts((stageCtx) => {
        if (!stageCtx.ssg) return;

        const stageNames = Object.keys(stageCtx.acts || {});
        for (const stageName of stageNames) {
            stageCtx.open({ name: stageName });

            const fullHtml = snapshotHtml(stageCtx, stageName);
            let byAct = pageHtmlByContextAndStage.get(stageCtx);
            if (!byAct) {
                byAct = new Map();
                pageHtmlByContextAndStage.set(stageCtx, byAct);
            }
            byAct.set(stageName, fullHtml);
        }
    });

    // 2) Snapshot contexts and build parent links
    const rawContexts = snapshotContexts();
    const contexts = buildParentLinks(rawContexts);

    console.log(
        'SSG registry snapshot:',
        contexts.map((s) => ({
            ctxKey: s.ctxKey,
            parentCtxKey: s.parentCtxKey,
            parentRoute: s.parentRoute,
            initial: s.initial,
            ssg: s.ssg,
            acts: Object.keys(s.stageRef.acts || {}),
        })),
    );

    return { contexts, pageHtmlByContextAndStage };
};

export { normalizeRouteToFolder, hasChildContextForStage };