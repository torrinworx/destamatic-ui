import {Observer, mount} from 'destam-dom';

const createContext = (def, transform = x => x) => {
	const getter = Symbol();
	const getValue = context => {
		const calc = state => {
			if (!state) {
				return def;
			}

			if (!state.hasValue) {
				state.hasValue = true;
				state.value = transform(state.raw, calc(state.parent));
			}

			return state.value;
		};

		return calc(context?.[getter]);
	};

	const Context = ({value, children}, cleanup, mounted) => {
		return (elem, _, before, context) => {
			context = {
				...context,
				[getter]: {
					parent: context?.[getter],
					raw: value,
					hasValue: false,
					value: null,
				},
			};

			return mount(elem, children, before, context);
		};
	};

	Context.use = component => (props, cleanup, mounted) => {
		return (elem, _, before, context) => {
			return mount(
				elem,
				component(getValue(context))(props, cleanup, mounted),
				before,
				context,
			);
		}
	};

	Context.def = def;
	Context.fromContext = getValue;

	return Context;
};

export default createContext;
