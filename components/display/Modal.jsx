import { mount } from 'destam-dom';
import { Observer } from 'destam';
import createContext from './Context';

/**
 * We store a list of { name, function } modal definitions,
 * along with an Observer storing the currently open modal name.
 * The user can call modal.set(name) to open or close (null) the modal.
 */
const ModalContext = createContext(
	null,
	(next, prev) => {
		// “next” is the user-supplied array of modal definitions
		// E.g. [{ name: 'SomeModal', function: SomeModal }, ... ] 
		// Keep an Observer that points to the active modal name (or null if closed).
		//
		// If we already had a `prev` context from a higher tier, reuse its openModal,
		// otherwise create a new Observer.
		const openModal = prev?.openModal || Observer.mutable(null);

		return {
			modals: next || [],
			openModal,
			set: (modalName) => openModal.set(modalName),
		};
	}
);

/**
 * This is the actual provider component:
 *   <Modals value={yourModalDefs}>
 *     ...children...
 *   </Modals>
*/
export const Modals = ModalContext(({ value, children }) => ThemeContext.use(h => {
	return (elem, _, before, context) => {
		// Insert context with our new “raw” value
		context = {
			...context,
			[ModalContext.def]: {
				parent: context?.[ModalContext.def],
				raw: value,
				hasValue: false,
				value: null,
			},
		};

		return mount(elem, children, before, context);
	};
}));

export default Modals;
