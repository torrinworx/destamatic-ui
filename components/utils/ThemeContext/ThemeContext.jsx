import createContext from './Context.jsx';
import { h } from './h.jsx';
import { assert } from 'destam/util';
import Observer from 'destam/Observer';

const ThemeContext = createContext('primary');

const createNode = (name, namespace) => {
	if (namespace) {
		return document.createElementNS(namespace, name);
	} else {
		return document.createElement(name);
	}
};

const use = ThemeContext.use;
ThemeContext.use = (component, namespace) =>
		use(context => ({theme = context, ref, ...props}, cleanup, mounted) => {
	assert(!ref || ref instanceof Node || ref instanceof Observer, "ref must either be a node or an observer");

	let lastElement = null;
	const themedH = (name, props = {}, ...children) => {
		if (typeof name === 'string') {
			if (!ref || !props.ref) {
				name = createNode(name, namespace);
			} else if (ref instanceof Node) {
				assert(ref.nodeName.toLowerCase() === name.toLowerCase());
				assert(ref.namespaceURI === (namespace ?? "http://www.w3.org/1999/xhtml"));
				name = ref;
			} else if (ref.isImmutable()) {
				const elem = ref.get();
				assert(elem.nodeName.toLowerCase() === name.toLowerCase());
				assert(ref.namespaceURI === (namespace ?? "http://www.w3.org/1999/xhtml"));
				name = elem;
			} else {
				name = createNode(name, namespace);
				ref.set(name);
			}

			assert(name instanceof Node);
			if (props.ref && props.ref instanceof Observer) {
				props.ref.set(name);
			}

			delete props.ref;
		}

		if (props.theme) props.theme = [theme, props.theme];
		return h(name, props, ...children);
	};

	props.theme = theme;
	return component(themedH)(props, cleanup, mounted);
});

export default ThemeContext;
