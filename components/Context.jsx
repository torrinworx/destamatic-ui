import { h } from './h';
import {Observer, mount} from 'destam-dom';


const createContext = (def, transform = x => x) => {
	const getter = Symbol();
	const search = elem => {
		let current = elem, val = def;
		while (current) {
			if (getter in current) {
				const state = current[getter];

				if (!state.hasValue) {
					state.hasValue = true;
					state.value = transform(state.raw, search(current.parentNode));
				}

				val = state.value;
				break;
			}

			current = current.parentNode;
		}

		return val;
	};

	const Context = ({value, children}, cleanup, mounted) => {
		// span is the only element that won't affect page layout so use that as a wrapper.
		const Span = <span />;
		Span[getter] = { raw: value, hasValue: false, value: null };

		return <Span>{children}</Span>;
	};

	Context.use = component => (props, cleanup, mounted) => {
		const ret = Observer.mutable(null);

		props = {...props};

		mounted(() => ret.set((elem, _, before) => {
			const val = search(elem, def);

			return mount(elem, h((_, cleanup, mounted) => {
				return component(val)(props, cleanup, mounted);
			}), before);
		}));

		return ret;
	};

	Context.def = def;
	Context.search = search;

	return Context;
};

export default createContext;
