import { assert } from 'destam/util';
import Observer from 'destam/Observer';
import { mount } from 'destam-dom';

import { h } from '../h/h.jsx';
import createContext from '../Context/Context.jsx';

const ThemeContext = createContext('primary');
export const FocusableContext = createContext();

const createNode = (name, namespace) => {
	if (namespace) {
		return document.createElementNS(namespace, name);
	} else {
		return document.createElement(name);
	}
};

const fromContext = ThemeContext.fromContext;
const create = (props, context, cleanup, namespace) => {
	const theme = props.theme ?? fromContext(context);
	const ref = props.ref;
	assert(!ref || ref instanceof Node || ref instanceof Observer, "ref must either be a node or an observer");

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

					const eventName = o[2].toLowerCase() + o.substring(3);
					if (eventName === 'focused') {
						const focusable = FocusableContext.fromContext(context);
						if (focusable) {
							cleanup(focusable(props[o], name));

							continue;
						}
					}

					enabledThemes.push(props[o].bool(eventName, null));
				}
			}

			if (props.isDisabled) {
				props.disabled = props.isDisabled;
				delete props.isDisabled;
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
	return (props, cleanup, mounted) => {
		return (elem, _, before, context) => {
			return mount(
				elem,
				component(create(props, context, cleanup, namespace))(props, cleanup, mounted),
				before,
				context,
			);
		};
	};

	return use(context => (props, cleanup, mounted) => {
		return component(h)(props, cleanup, mounted);
	});
};

ThemeContext.fromContext = (context, props, cleanup) => {
	return create(props, context, cleanup);
};

ThemeContext.namespace = namespace => {
	return {
		fromContext: (context, props, cleanup) => create(props, context, cleanup, namespace),
	};
};

export default ThemeContext;
