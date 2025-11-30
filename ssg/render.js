import { mount } from 'destam-dom';
import { __STAGE_CONTECT_REGISTRY, __STAGE_SSG_DISCOVERY_ENABLED__ } from '../components/display/Stage';

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
			.map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
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
 * Does NOT try to append to `document` itself.
 */
const ensureDocumentSkeleton = () => {
	// <html>
	let htmlEl = document.documentElement;
	if (!htmlEl) {
		htmlEl = document.createElement('html');
		document.documentElement = htmlEl;
	}

	// optional default attrs
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

	// If you care about a consistent tree, keep head/body as children of html:
	// (These checks avoid duplicating them if already there)
	if (!htmlEl.childNodes.includes(headEl)) {
		htmlEl.append(headEl);
	}
	if (!htmlEl.childNodes.includes(bodyEl)) {
		htmlEl.append(bodyEl);
	}

	return { htmlEl, headEl, bodyEl };
};

const openAllStagesOnce = (stageCtx) => {
	const stageNames = Object.keys(stageCtx.stages || {});
	console.log('openAllStagesOnce for ctx', stageCtx.id, '=>', stageNames);
	for (const name of stageNames) {
		stageCtx.open({ name });
	}
};

/**
 * Discovery pass:
 *  - For each StageContext we haven't explored yet,
 *    open all its stages once.
 *  - If that causes new StageContexts to register,
 *    they will be picked up in the next iteration.
 *  - After we open all stages of a context, we can run `onExplored(stageCtx)`.
 */
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

const normalizeRouteToFolder = (route) => {
	if (!route || route === '/') return '/';
	const trimmed = String(route).replace(/^\/|\/$/g, '');
	return '/' + trimmed + '/';
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
			// Duplicate for SSG purposes; you can log if you want:
			// console.log('SSG: deduping duplicate StageContext', s.id, 'for key', key);
		}
	}

	return Array.from(seen.values());
};

const hasChildContextForStage = (contexts, parentCtx, stageName) => {
	// For now, use a simple heuristic:
	// - child.parentId === parentCtx.id
	// - child.route is a non-root (e.g. 'blogs')
	// - and stageName case-insensitively matches that route segment
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

const render = (Root) => {
	const pages = [];

	const { bodyEl } = ensureDocumentSkeleton();

	// Enable discovery
	__STAGE_SSG_DISCOVERY_ENABLED__.value = true;

	// Initial mount
	mount(bodyEl, Root());

	// Capture at discovery time
	const pageHtmlByContextAndStage = new Map();

	// Discovery, but for *each* context we open all its stages and snapshot HTML
	discoverAllStageContexts((stageCtx) => {
		if (!stageCtx.ssg) return;

		const stageNames = Object.keys(stageCtx.stages || {});

		for (const stageName of stageNames) {
			// At this point, stageCtx.current has been set to each stage during openAllStagesOnce.
			// But we might want to explicitly open this stage again to ensure it's the active one.
			stageCtx.open({ name: stageName });

			const fullHtml = renderDocument();

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

	for (const ctxInfo of contexts) {
		if (!ctxInfo.ssg) continue;

		const routeFolder = normalizeRouteToFolder(ctxInfo.route);
		const stageCtx = __STAGE_CONTECT_REGISTRY.find((s) => s.id === ctxInfo.id);
		if (!stageCtx) continue;

		const stageNames = Object.keys(stageCtx.stages || {});

		for (const stageName of stageNames) {
			// Skip wrapper-only stages whose content is "owned" by a child context
			if (hasChildContextForStage(contexts, ctxInfo, stageName)) {
				// e.g. root Blogs stage when there's a /blogs child StageContext
				continue;
			}

			const key = `${ctxInfo.id}:${stageName}`;
			const fullHtml = pageHtmlByContextAndStage.get(key);
			if (!fullHtml) continue;

			const isInitial =
				ctxInfo.initial && ctxInfo.initial === stageName;
			const fileName = isInitial ? 'index' : stageName;

			pages.push({
				route: routeFolder,
				name: fileName,
				html: fullHtml,
			});
		}
	}

	return pages;
};

export default render;
