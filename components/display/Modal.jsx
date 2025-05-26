import { OObject } from 'destam';

import Icon from '../display/Icon';
import Shown from '../utils/Shown';
import Popup from '../utils/Popup';
import Theme from '../utils/Theme';
import Paper from '../display/Paper';
import Button from '../inputs/Button';
import Typography from './Typography';
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

const DefTemplate = ({ m, children }) => {
	return <Paper>
		<div theme='row_spread'>
			<Typography type='h2' label={m.label} />
			<Button
				type='icon'
				icon={<Icon name='x' size={30} />}
				onClick={() => m.current = false}
			/>
		</div>
		{children}
	</Paper>;
};

export const ModalContext = createContext(() => null, (value) => {
	const { modals, ...props } = value;

	return OObject({
		current: false,
		modals: modals,
		template: DefTemplate,
		...props,
	});
});

export const Modal = ModalContext.use(m => ThemeContext.use(h => {
	return (_, cleanup) => {
		const handleEscape = (e) => {
			if (e.which === 27) {
				e.preventDefault();
				m.current = false;
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
					if (key !== 'current' && key !== 'modals' && key !== 'template') delete m[key];
				});
				m.template = DefTemplate;
			}
		}));

		return <Shown value={m.observer.path('current')} >
			<Popup style={{ inset: 0 }}>
				<div theme='modalOverlay' onClick={() => !m.noClickEsc ? (m.current = false) : null} />
				<div theme='modalWrapper'>
					{m.observer.path('template').map(T => {
						return <T m={m} >
							{m.observer.path('current').map(c => c ? m.modals[c]() : null)}
						</T>
					})}
				</div>
			</Popup>
		</Shown>
	};
}));
