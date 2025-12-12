import { stageRegistry } from '../components/display/Stage';
import { suspendRegistry } from '../components/utils/Suspend';

// Wait until all current suspends have settled.
// Loop because resolving one suspend might start new ones.
const waitForAllSuspendsToSettle = async () => {
    while (true) {
        const pending = [...suspendRegistry];
        if (!pending.length) break;
        await Promise.allSettled(pending);
    }
};

let _stageCounter = 0;
const stageIds = new WeakMap();
const getStageId = (stageCtx) => {
    if (!stageIds.has(stageCtx)) {
        stageIds.set(stageCtx, `stage_${_stageCounter++}`);
    }
    return stageIds.get(stageCtx);
};

/**
 * Open all acts of a stage context at least once
 * to force children to mount.
 */
const openAllActsOnce = (stageCtx) => {
    const id = getStageId(stageCtx);
    const stageNames = Object.keys(stageCtx.acts || {});
    console.log(`SSG: openAllActsOnce(${id}) acts=`, stageNames);

    for (const name of stageNames) {
        console.log(`  -> ${id}.open("${name}") (discovery)`);
        stageCtx.open({ name });
    }
};

/**
 * Core discovery loop: structural only.
 *
 * This is async:
 * - we repeatedly scan stageRegistry
 * - for any un-explored stage, we open all of its acts
 * - then we wait for all suspends that might have been triggered by those opens
 * - repeat until no new stages appear
 */
const discoverAllStageContexts = async () => {
    const explored = new Set(); // of Stage objects

    while (true) {
        let discoveredSomething = false;

        const snapshot = Array.from(stageRegistry);
        console.log('SSG: discoverAllStageContexts snapshot size =', snapshot.length);

        for (const stageCtx of snapshot) {
            if (!stageCtx) continue;
            if (explored.has(stageCtx)) continue;

            const id = getStageId(stageCtx);
            console.log(
                `SSG: discovering ${id} (parentRoute=${stageCtx.parentRoute}, initial=${stageCtx.initial})`,
            );

            explored.add(stageCtx);
            discoveredSomething = true;

            openAllActsOnce(stageCtx);
        }

        if (!discoveredSomething) break;

        // Wait for any async work triggered by newly opened stages
        await waitForAllSuspendsToSettle();
    }

    console.log('SSG: discovery complete. stageRegistry size =', stageRegistry.length);
};

const makeStageKey = (stageCtx) => {
    const names = Object.keys(stageCtx.acts || {}).sort();
    return names.join(',');
};

/**
 * Snapshot all SSG-enabled stage contexts.
 * No dedupe: each Stage instance becomes its own ctx.
 */
const snapshotContexts = () => {
    const contexts = [];

    for (const stageCtx of stageRegistry) {
        if (!stageCtx?.ssg) continue;

        const parentRoute = stageCtx.parentRoute || null;
        const stagesKey = makeStageKey(stageCtx);
        const initial = stageCtx.initial || null;
        const id = getStageId(stageCtx);

        const ctxKey = id; // use stageId as ctxKey to keep mapping 1:1

        console.log(
            `SSG: snapshotContexts -> ctx ${ctxKey}, parentRoute=${parentRoute}, initial=${initial}, acts=${stagesKey}`,
        );

        contexts.push({
            ctxKey,
            stageRef: stageCtx,
            parentRoute,
            initial,
            ssg: !!stageCtx.ssg,
        });
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
    const parentsByActName = new Map(); // actName -> [ctx]

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

        if (
            String(child.parentRoute).toLowerCase() ===
            String(stageName).toLowerCase()
        ) {
            return true;
        }
    }
    return false;
};

/**
 * Main discovery API.
 *
 * NOTE: This now returns only structure: no HTML.
 *
 * @returns {Promise<{
 *   contexts: Array<{ ctxKey, stageRef, parentCtxKey, parentRoute, initial, ssg }>,
 * }>}
 */
export const discoverStages = async () => {
    console.log('SSG: ===== START DISCOVERY PASS =====');

    await discoverAllStageContexts();

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
    console.log('SSG: ===== END DISCOVERY PASS =====');

    return { contexts };
};

export { normalizeRouteToFolder, hasChildContextForStage };
