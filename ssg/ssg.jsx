// destamatic-ui/ssg.js
import { mount } from 'destam-dom';

/**
 * Basic HTML escapers for server-side serialization.
 */
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
 * Serialize a Node from the Node-based DOM shim used in tests/SSR.
 * Expects your global.document / global.Node shim to be in place.
 */
function renderNode(node) {
  // Text node case: name === '' in your shim
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

function renderToString(Root) {
  const root = document.createElement('div');
  root.setAttribute('id', 'app');

  // Mount the JSX value, not the function itself
  mount(root, <Root />);

  return renderNode(root);
}

export default renderToString;
