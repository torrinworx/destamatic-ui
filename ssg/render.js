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

const renderToString = (Root) => {
	const pages = [];

	const root = document.createElement('div');
	root.setAttribute('id', 'app');

	mount(root, Root());

	for (const stageContext of __STAGE_CONTECT_REGISTRY) {
		for (const [name, value] of Object.entries(stageContext.stages)) {
			console.log("STAGE: ", name, value);
			stageContext.open({ name });
			pages.push({
				name,
				route: stageContext.route,
				html: renderNode(root)
			})
		}
	}

	console.log("THIS IS STAGE REGISTRY: ", __STAGE_CONTECT_REGISTRY);

	return pages;
}

export default renderToString;
