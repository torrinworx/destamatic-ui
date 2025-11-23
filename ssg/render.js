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

const renderNode = (node) => {

	if (node.name === '') {
		return escapeText(node.textContent ?? node.textContent_ ?? '');
	}

	const tag = node.name;
	let attrs = '';

	for (const [name, value] of Object.entries(node.attributes || {})) {
		if (value === '') attrs += ` ${name}`;
		else attrs += ` ${name}="${escapeAttr(value)}"`;
	}

	const styleEntries = Object.entries(node.style || {});
	if (styleEntries.length) {
		const styleStr = styleEntries
			.map(([k, v]) => `${k.replace(/[A-Z]/g, m => '-' + m.toLowerCase())}:${v}`)
			.join(';');
		attrs += ` style="${escapeAttr(styleStr)}"`;
	}

	const childrenHtml = (node.childNodes || []).map(renderNode).join('');
	return `<${tag}${attrs}>${childrenHtml}</${tag}>`;
}

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

	const root = document.createElement('div');
	root.setAttribute('id', 'app');

	mount(root, Root());

	for (const stageContext of __STAGE_CONTECT_REGISTRY) {
		console.log("THIS IS THE INITIAL STAGE: ", stageContext.initial)
		for (const name of Object.keys(stageContext.stages)) {
			// console.log("STAGE: ", name, value);
			stageContext.open({ name });
			pages.push({
				name,
				route: stageContext.route, // 
				html: renderNode(root)
			})
		}
	}

	return pages;
}

export default render;
