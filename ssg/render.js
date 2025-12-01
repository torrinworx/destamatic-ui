import { mount } from 'destam-dom';
import { __STAGE_CONTECT_REGISTRY } from '../components/display/Stage';
import {
	discoverStages,
	normalizeRouteToFolder,
	hasChildContextForStage,
} from './discovery';

// --- HTML / DOM helpers stay here ---

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

// --- main render function ---

const render = (Root) => {
	const pages = [];

	const { bodyEl } = ensureDocumentSkeleton();

	// Initial mount
	mount(bodyEl, Root());

	// Run discovery, passing a callback to produce HTML for each (ctx, stage)
	const { contexts, pageHtmlByContextAndStage } = discoverStages(() => {
		// we ignore stageCtx here because your current logic
		// just snapshots the entire document each time
		return renderDocument();
	});

	// Build pages array from contexts + captured HTML
	for (const ctxInfo of contexts) {
		if (!ctxInfo.ssg) continue;

		const routeFolder = normalizeRouteToFolder(ctxInfo.route);
		const stageCtx = __STAGE_CONTECT_REGISTRY.find((s) => s.id === ctxInfo.id);
		if (!stageCtx) continue;

		const stageNames = Object.keys(stageCtx.stages || {});

		for (const stageName of stageNames) {
			// Skip wrapper-only stages whose content is "owned" by a child context
			if (hasChildContextForStage(contexts, ctxInfo, stageName)) {
				continue;
			}

			const key = `${ctxInfo.id}:${stageName}`;
			const fullHtml = pageHtmlByContextAndStage.get(key);
			if (!fullHtml) continue;

			const isInitial = ctxInfo.initial && ctxInfo.initial === stageName;
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
