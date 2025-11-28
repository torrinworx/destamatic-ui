import { mount } from 'destam-dom';
import { __STAGE_CONTECT_REGISTRY } from '../components/display/Stage';

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

/**
 * Ensure client boot script exists in <body> (optional).
 */
const ensureBootScript = () => {
	const bodyEl = document.body;
	if (!bodyEl) return;

	let hasBootScript = false;
	for (const child of Array.from(bodyEl.childNodes || [])) {
		if (
			child.name === 'script' &&
			child.attributes?.type === 'module' &&
			child.attributes?.src === './index.jsx'
		) {
			hasBootScript = true;
			break;
		}
	}

	if (!hasBootScript) {
		const bootScript = document.createElement('script');
		bootScript.setAttribute('type', 'module');
		bootScript.setAttribute('src', './index.jsx');
		bodyEl.append(bootScript);
	}
};

/**
 * Renders a destamatic-ui/destam-dom webapp (Root) as html
 * 
 * contains logic to render all appropriate ssg pages, returns them to build.js to
 * write them to output build/dist folder.
 * 
 * TODO:
 * - handle nested StageContexts? Explicite nesting? or just based on the 'route' param the user defines
 * - handle index files. For each StageContext, how do we tell this render() to set the initial
 * 		page as the "index" of the folder?
 * - hide or show the /index.html, /Landing.html? how do we handle that? 
 * - allow for custom html templates? Should that just be something handled by another component in App.jsx
 * 		for writing to other headers like jsonld? 
 * - how do we ensure tha the js is loaded no matter the html page you end up on? Proper routing? See destam-web-core?
 * 
 * 
 * Maybe for stages in stages we just need to know the tree of parent stages to activate that stage?]
 * 
 * parent <- root StageContext
 *  - landing	
 * 	- blogs <- stage of parent, but also new StageContext itself.
 *  	- blog-1
 * 		- blog-2
 * 		- blog-3
 * parent-2 <- second root StageContext in the same app?
 *  - landing-2	
 * 	- blogs-2
 *  	- blog-1
 * 		- blog-2
 * 		- blog-3
 * 
 * @param {*} Root 
 * @returns 
 */
const render = (Root) => {
	const pages = [];

	const { bodyEl } = ensureDocumentSkeleton();

	// Mount app directly into <body>
	mount(bodyEl, Root());

	for (const stageContext of __STAGE_CONTECT_REGISTRY) {
		for (const name of Object.keys(stageContext.stages)) {
			stageContext.open({ name });

			// App may have mutated head/body/html here

			ensureBootScript();
			const fullHtml = renderDocument();

			pages.push({
				name,
				route: stageContext.route,
				html: fullHtml,
			});
		}
	}

	return pages;
};

export default render;
