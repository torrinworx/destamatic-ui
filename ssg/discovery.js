import { __STAGE_CONTECT_REGISTRY, __STAGE_SSG_DISCOVERY_ENABLED__ } from '../components/display/Stage';

const openAllStagesOnce = (stageCtx) => {
	const stageNames = Object.keys(stageCtx.stages || {});
	console.log('openAllStagesOnce for ctx', stageCtx.id, '=>', stageNames);
	for (const name of stageNames) {
		stageCtx.open({ name });
	}
};

const discoverAllStageContexts = (onExplored) => {
	const exploredIds = new Set();
	let discoveredSomething = true;

	while (discoveredSomething) {
		discoveredSomething = false;

		const snapshot = __STAGE_CONTECT_REGISTRY.slice();

		for (const stageCtx of snapshot) {
			if (!exploredIds.has(stageCtx.id)) {
				exploredIds.add(stageCtx.id);
				discoveredSomething = true;

				// Open all its stages; this will mount nested providers
				openAllStagesOnce(stageCtx);

				// Allow caller to do something (e.g., snapshot HTML per stage)
				if (typeof onExplored === 'function') {
					onExplored(stageCtx);
				}
			}
		}
	}
};

const makeStageKey = (stageCtx) => {
	const names = Object.keys(stageCtx.stages || {}).sort();
	return names.join(',');
};

const snapshotAndDedupeContexts = () => {
	const seen = new Map(); // key: `${route}|${stagesKey}`, value: ctxInfo

	for (const s of __STAGE_CONTECT_REGISTRY) {
		if (!s.ssg) continue;

		const route = s.route || '/';
		const stagesKey = makeStageKey(s);
		const key = `${route}|${stagesKey}`;

		if (!seen.has(key)) {
			seen.set(key, {
				id: s.id,
				parentId: s.parentId,
				route,
				initial: s.initial || null,
				ssg: !!s.ssg,
			});
		} else {
			// Duplicate for SSG purposes
			// console.log('SSG: deduping duplicate StageContext', s.id, 'for key', key);
		}
	}

	return Array.from(seen.values());
};

const normalizeRouteToFolder = (route) => {
	if (!route || route === '/') return '/';
	const trimmed = String(route).replace(/^\/|\/$/g, '');
	return '/' + trimmed + '/';
};

const hasChildContextForStage = (contexts, parentCtx, stageName) => {
	const parentId = parentCtx.id;
	for (const child of contexts) {
		if (child.parentId !== parentId) continue;

		const childFolder = normalizeRouteToFolder(child.route || '/'); // e.g. '/blogs/'
		if (childFolder === '/') continue;

		const seg = childFolder.split('/').filter(Boolean).pop(); // 'blogs'
		if (!seg) continue;

		if (seg.toLowerCase() === String(stageName).toLowerCase()) {
			return true;
		}
	}
	return false;
};

// --- main exported discovery API ---

/**
 * Runs the stage discovery pass and captures HTML per (context, stage).
 *
 * @param {Function} snapshotHtml - fn that receives (stageCtx, stageName) and returns full HTML string
 * @returns {{
 *   contexts: Array<{ id, parentId, route, initial, ssg }>,
 *   pageHtmlByContextAndStage: Map<string, string>, // key: `${ctxId}:${stageName}`
 * }}
 */
export const discoverStages = (snapshotHtml) => {
	const pageHtmlByContextAndStage = new Map();

	// Enable discovery
	__STAGE_SSG_DISCOVERY_ENABLED__.value = true;

	// Discovery: for each context, open its stages and snapshot HTML
	discoverAllStageContexts((stageCtx) => {
		if (!stageCtx.ssg) return;

		const stageNames = Object.keys(stageCtx.stages || {});

		for (const stageName of stageNames) {
			// ensure this stage is active
			stageCtx.open({ name: stageName });

			const fullHtml = snapshotHtml(stageCtx, stageName);
			pageHtmlByContextAndStage.set(`${stageCtx.id}:${stageName}`, fullHtml);
		}
	});

	// Freeze registry
	const contexts = snapshotAndDedupeContexts();

	// Disable further registration to avoid noise
	__STAGE_SSG_DISCOVERY_ENABLED__.value = false;

	console.log(
		'SSG registry snapshot:',
		contexts.map((s) => ({
			id: s.id,
			parentId: s.parentId,
			route: s.route,
			initial: s.initial,
			ssg: s.ssg,
		}))
	);

	return { contexts, pageHtmlByContextAndStage };
};

export { normalizeRouteToFolder, hasChildContextForStage };
