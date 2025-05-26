import { Observer } from 'destam';

import Shown from '../utils/Shown';
import Popup from '../utils/Popup';
import Theme from '../utils/Theme';
import createContext from '../utils/Context';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	modalOverlay: {
		background: 'rgba(0, 0, 0, 0.7)',
		height: '100vh',
		width: '100vw'
	},
	modalWrapper: {
		top: '50%',
		left: '50%',
		position: 'absolute',
		transform: 'translate(-50%, -50%)',
	}
});

/**
 * ModalContext is used to manage modal states within an application.
 *
 * It supports maintaining:
 * - The visibility state of the current modal.
 * - A list of possible modal components that can be displayed.
 *
 * @param {Object} value - The initial state values for the context. Should include:
 *  - `modals`: An object of modal component functions.
 *
 * Any additional properties within the `value` object are added to the context and can
 * be used for custom modal context.
 *
 * @returns {Object} Contains:
 *  - `current`: An observable boolean indicating whether any modal is currently visible.
 *  - `modals`: An immutable collection of modal component functions available in the context.
 *  - Additional custom properties from `value` not directly managed by default.
 */
export const ModalContext = createContext(() => null, (value) => {
	const { modals, ...props } = value;

	return {
		current: Observer.mutable(false),
		modals: Observer.immutable(modals),
		...props,
	};
});

/**
 * Modal component is a consumer of ModalContext that manages the lifecycle and rendering
 * of the modal components.
 *
 * It ensures:
 * - Modal visibility is controlled via `m.current`.
 * - Context resets non-essential data upon modal closure for consistent behavior.
 * - Modals can be exited via overlay interaction unless forcible restrictions are applied.
 *
 * @returns {Function} A functional component used within a render method, capable of rendering the modal UI.
 */
export const Modal = ModalContext.use(m => ThemeContext.use(h => {
	return (_, cleanup) => {
		cleanup(m.current.effect(mo => {
			if (!mo) {
				Object.keys(m).forEach(key => {
					// don't need to reset modals because it's immutable
					if (key !== 'current' && key !== 'modals') delete m[key];
				});
			}
		}));

		return <Shown value={m.current} >
			<Popup style={{ inset: 0 }}>
				<div theme='modalOverlay' onClick={() => {
					if (!m.forced) m.current.set(false)
				}} />
				<div theme='modalWrapper'>
					{m.current.map(c => c ? m.modals.get()[c]() : null)}
				</div>
			</Popup>
		</Shown>
	};
}));
