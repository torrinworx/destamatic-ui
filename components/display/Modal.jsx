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

const DefaultTemplate = ThemeContext.use(h => ({ m, children, closeSignal }, cleanup, mounted) => {
	const shown = Observer.mutable(false);

	const handleEscape = (e) => {
		if (e.which === 27) {
			e.preventDefault();
			m.current = false;
		}
	};

	mounted(() => {
		queueMicrotask(() => {
			setTimeout(() => shown.set(true), 10);
		});

		if (!m.noEsc) {
			window.addEventListener('keydown', handleEscape);
			cleanup(() => {
				window.removeEventListener('keydown', handleEscape);
			});
		}
	});
		
	cleanup(closeSignal.watch(() => {
		shown.set(!closeSignal.get());
	}));
	
/*
	Object.keys(m).forEach(key => {
		if (key !== 'current' && key !== 'modals' && key !== 'template') {
			delete m[key];
		}
	});
	*/

	return <Popup
		style={{
			inset: 0,
			transition: 'opacity 5000ms ease-in-out',

			opacity: shown.map(shown => shown ? 1 : 0),
			pointerEvents: shown.map(shown => shown ? null : 'none'),
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
	</Popup>;
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
	const Modal = ({}, cleanup) => {
		const aniCurrent = Observer.mutable(null);
		cleanup(m.observer.path('current').effect(current => {
			if (current) {
				aniCurrent.set(current);
			} else {
				const timeout = setTimeout(() => aniCurrent.set(null), 5000);
				return () => {
					clearTimeout(timeout);
				};
			}
		}));

		return Observer.all([
			m.observer.path('template'),
			aniCurrent,
		]).map(([T, c]) => {
			console.log(T, c)
			if (!c) {
				return null;
			}

			const closeSignal = m.observer.path('current').map(current => {
				if (!current) {
					return true;
				} else {
					return current !== c;
				}
			});

			return <T closeSignal={closeSignal} m={m}>{m.modals[c]()}</T>;
		});
	};

	return Modal;
}));
