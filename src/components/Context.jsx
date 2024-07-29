import h from './h';
import {Observer, mount} from 'destam-dom';

const createContext = (def, transform = x => x) => {
	const getter = Symbol();

	const Context = ({value, children}, cleanup, mounted) => {
		// span is the only element that won't affect page layout so use that as a wrapper.
		const Span = <span />;
		Span[getter] = transform(value);

		return <Span>{children}</Span>;
	};

	Context.use = component => (props, cleanup, mounted) => {
		const ret = Observer.mutable(null);

		props = {...props};

		mounted(() => ret.set((elem, _, before) => {
			let current = elem, val = def;
			while (current) {
				if (getter in current) {
					val = current[getter];
					break;
				}

				current = current.parentNode;
			}

			return mount(elem, h((_, cleanup, mounted) => {
				return component(val)(props, cleanup, mounted);
			}), before);
		}));

		return ret;
	};

	Context.def = def;

	return Context;
};

export default createContext;
