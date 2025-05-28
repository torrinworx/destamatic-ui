import { OObject, Observer } from 'destam';

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

const DefaultTemplate = ThemeContext.use(h => ({ m, children }, cleanup) => {
	const opacity = Observer.mutable(0);
	const show = Observer.mutable(false);

	const handleEscape = (e) => {
		if (e.which === 27) {
			e.preventDefault();
			m.current = false;
		}
	};

	cleanup(m.observer.path('current').effect(mo => {
		if (mo) {
			queueMicrotask(() => {
				setTimeout(() => opacity.set(1), 10);
			});

			show.set(true);


			if (!m.noEsc) {
				window.addEventListener('keydown', handleEscape);
				return () => window.removeEventListener('keydown', handleEscape);
			}
		} else {
			opacity.set(0);

			queueMicrotask(() => {
				setTimeout(() => {
					show.set(false);
				}, 150);
			});

			Object.keys(m).forEach(key => {
				if (key !== 'current' && key !== 'modals' && key !== 'template') {
					delete m[key];
				}
			});
			m.template = DefaultTemplate;
		}
	}));

	return <Shown value={show}>
		<Popup
			style={{
				inset: 0,
				transition: 'opacity 150ms ease-in-out',
				opacity
			}}
		>
			<div
				theme='modalOverlay'
				onClick={() => !m.noClickEsc ? (m.current = false) : null}
			/>
			<div theme='modalWrapper'>
				<Paper>
					<div theme='row_spread'>
						<Typography type='h2' label={m.observer.map(m => m.label ? m.label : '')} />
						<Button
							type='icon'
							icon={<Icon name='x' size={30} />}
							onClick={() => m.current = false}
						/>
					</div>
					{children}
				</Paper>
			</div>
		</Popup>
	</Shown >;
});

export const ModalContext = createContext(() => null, (value) => {
	const { modals, ...props } = value;

	return OObject({
		current: false,
		modals: modals,
		template: DefaultTemplate,
		...props,
	});
});

export const Modal = ModalContext.use(m => ThemeContext.use(h => {
	return () => {
		/* Issue here with these: they disappear before the fade out is complete, and it messes with the modal layout, very noticable and annoying */
		return m.observer.path('template').map(T => {
			return <T m={m}>{m.observer.path('current').map(c => c ? m.modals[c]() : null)}</T>;
		});
	};
}));
