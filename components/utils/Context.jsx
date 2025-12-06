import { mount } from 'destam-dom';
import { OArray, OObject, UUID } from 'destam';

/**
 * createContext(def, transform?)
 *
 * Creates a context factory that can be used to provide a value to a
 * subtree (`<Context value={...}>...`) and read/transform that value
 * in child components (`Context.use(...)`).
 *
 * The context value is resolved lazily and can depend on the raw
 * `value` passed into the nearest `<Context>`, the computed value of
 * the parent context, and a live list of child context states.
 *
 * All values stored in the internal state (raw, value, children, etc.)
 * are ephemeral and only valid for the current mount cycle. Persisting
 * or reusing them across remounts will not yield the same state or
 * references.
 *
 * @param {any} def
 *   Default value used when there is no context in scope. Can be a value
 * 	 or a function; if you rely on functions as defaults, you’re
 *   responsible for calling them where appropriate.
 *
 * @param {Function} [transform=(raw, parent, children) => raw]
 *   Called to derive the effective context value for each provider.
 *   Signature:
 *     - raw:      the `value` prop passed into this `<Context>`
 *     - parent:   the resolved context value from the nearest parent (or `def`)
 *     - children: an observable array of child context state objects
 *   Must return the computed value for this context node.
 *
 * @returns {Function} Context
 *   A mountable function:
 *
 *   ```js
 *   const MyContext = createContext(defaultValue, (raw, parent, children) => {
 *     // compute and return the effective value
 *   });
 *
 *   // Providing:
 *   <MyContext value={...}>
 *     ...children...
 *   </MyContext>
 *
 *   // Consuming:
 *   const UseMyContext = MyContext.use(value => (props, cleanup, mounted) => {
 *     // value is the resolved context for this subtree
 *     return (elem, _, before, context) => {
 *       // return children / DOM via mount(...)
 *     };
 *   });
 *   ```
 * 
 *   @property {any} Context.def
 *     The original `def` passed into `createContext`.
 *
 *   @property {Function} Context.fromContext
 *     (context) => value
 *     Low-level accessor used internally to resolve the current value from
 *     a `context` object. You usually don’t need this unless you’re wiring
 *     up custom integration.
 *
 *   @property {Function} Context.use
 *     Higher order helper to consume the context in a component.
 *
 *     Usage:
 *     ```js
 *     const MyContext = createContext('default');
 *
 *     const MyConsumer = MyContext.use(value => (props, cleanup, mounted) => {
 *       return (elem, _, before, context) => {
 *         // you can use `value` here
 *         return mount(elem, /* children *\/, before, context);
 *       };
 *     });
 *     ```
 *
 *     `Context.use(component)` returns a new component factory with signature:
 *       (props, cleanup, mounted) => (elem, _, before, context) => ...
 *
 *     Inside `component`, `value` is the resolved context for the current scope.
 */
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
