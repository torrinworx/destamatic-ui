import createContext from './Context';
import { h } from './h';
import { assert } from 'destam/util';
import Observer from 'destam/Observer';

const ThemeContext = createContext('primary');

const use = ThemeContext.use;
ThemeContext.use = (component) =>
		use(context => ({theme = context, ref, ...props}, cleanup, mounted) => {
	assert(!ref || ref instanceof Node || ref instanceof Observer, "ref must either be a node or an observer");

	let lastElement = null;
	const themedH = (name, props = {}, ...children) => {
		if (typeof name === 'string' && props.ref) {
			if (!ref) {
				name = document.createElement(name);
			} else if (ref instanceof Node) {
				assert(ref.nodeName.toLowerCase() === name.toLowerCase());
				name = ref;
			} else if (ref.isImmutable()) {
				const elem = ref.get();
				assert(elem.nodeName.toLowerCase() === name.toLowerCase());
				name = elem;
			} else {
				name = document.createElement(name);
				ref.set(name);
			}

			assert(name instanceof Node);
			if (props.ref instanceof Observer) {
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
