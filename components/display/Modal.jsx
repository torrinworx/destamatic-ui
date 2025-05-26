import { OObject } from 'destam';

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

export const ModalContext = createContext(() => null, (value) => {
	const { modals, ...props } = value;

	return OObject({
		current: false,
		modals: modals,
		...props,
	});
});

export const Modal = ModalContext.use(m => ThemeContext.use(h => {
	return ({ template }, cleanup) => {
		const handleEscape = (e) => {
			if (e.which === 27) {
				e.preventDefault();
				m.current.set(false);
			}
		};

		cleanup(m.observer.path('current').effect(mo => {
			if (mo && !m.noEsc) {
				window.addEventListener('keydown', handleEscape);
				return () => window.removeEventListener('keydown', handleEscape);
			}
			if (!mo) {
				Object.keys(m).forEach(key => {
					// don't need to reset modals because it's immutable
					if (key !== 'current' && key !== 'modals') delete m[key];
				});
			}
		}));

		return <Shown value={m.observer.path('current')} >
			<Popup style={{ inset: 0 }}>
				<div theme='modalOverlay' onClick={() => {
					if (!m.noClickEsc) m.current = false;
				}} />
				<div theme='column'>
					<div>

					</div>
				</div>
				<div theme='modalWrapper'>
					{m.observer.path('current').map(c => c ? m.modals[c]() : null)}
				</div>
			</Popup>
		</Shown>
	};
}));

// somehow add a modal template that the user can add, the temaplte will take in variables from the contextd when it's called?
