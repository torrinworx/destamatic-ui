import { assert } from 'destam/util';
import Observer from 'destam/Observer';

import { h } from '../h/h.jsx';
import createContext from '../Context/Context.jsx';

const ThemeContext = createContext('primary');

const createNode = (name, namespace) => {
	if (namespace) {
		return document.createElementNS(namespace, name);
	} else {
		return document.createElement(name);
	}
};

const create = (props, context, namespace) => {
	const theme = props.theme ?? context;
	const ref = props.ref;
	assert(!ref || ref instanceof Node || ref instanceof Observer, "ref must either be a node or an observer");

	let lastElement = null;
	const themedH = (name, props = {}, ...children) => {
		const enabledThemes = [];

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

			for (const o in props) {
				if (o.length >= 3 && o.startsWith('is') && o[2].toLowerCase() !== o[2]) {
					if (!props[o]) {
						delete props[o];
					}

					const name = o[2].toLowerCase() + o.substring(3);
					enabledThemes.push(props[o].bool(name, null));
				}
			}

			delete props.ref;
		}

		if (props.theme) props.theme = [theme, props.theme, ...enabledThemes];
		return h(name, props, ...children);
	};

	props.theme = theme;
	return themedH;
};

const use = ThemeContext.use;
ThemeContext.use = (component, namespace) => {
	return use(context => (props, cleanup, mounted) => {
		const h = create(props, context, namespace);
		return component(h)(props, cleanup, mounted);
	});
};

const fromContext = ThemeContext.fromContext;
ThemeContext.fromContext = (context, props) => {
	return create(props, fromContext(context));
};

ThemeContext.namespace = namespace => {
	return {
		fromContext: (context, props) => create(props, fromContext(context), namespace),
	};
};

export default ThemeContext;
