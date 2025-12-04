import { OArray, mount } from 'destam-dom';

const createContext = (def, transform = x => x) => {
	const getter = Symbol();

	const getValue = context => {
		const calc = state => {
			if (!state) {
				return def;
			}

			if (!state.hasValue) {
				state.hasValue = true;
				state.value = transform(
					state.raw,
					calc(state.parent),
					state.children
				);
			}

			return state.value;
		};

		return calc(context?.[getter]);
	};

	const Context = ({ value, children }) => {
		return (elem, _, before, context) => {
			const parentState = context?.[getter];

			const state = {
				parent: parentState,
				raw: value,
				hasValue: false,
				value: null,
				children: OArray([]),
			};

			if (parentState) {
				parentState.children.push(state);
			}

			context = {
				...context,
				[getter]: state,
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
		};
	};

	Context.def = def;
	Context.fromContext = getValue;

	return Context;
};

export default createContext;