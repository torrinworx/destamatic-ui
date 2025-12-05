import { mount } from 'destam-dom';
import { OArray, OObject, UUID } from 'destam';

const createContext = (def, transform = x => x) => {
	const getter = Symbol();

	const getValue = (context) => {
		const calc = state => {
			if (!state) return def;

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

	const Context = ({ value, children }, cleanup) => {
		return (elem, _, before, context) => {
			const parent = context?.[getter];

			const id = UUID();
			const state = OObject({
				id,
				parent,
				raw: value,
				hasValue: false,
				value: null,
				children: OArray([]),
			});

			if (parent) {
				parent?.children.push(state)
				cleanup(() => {
					const index = parent?.children.findIndex(child => child.id === id);
					parent?.children.splice(index, 1);
				})
			};

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
