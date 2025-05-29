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

const DefaultTemplate = ThemeContext.use(h => ({ m, children }, cleanup, mounted) => {
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

	cleanup(m.closeSignal.watch(() => {
		shown.set(!m.closeSignal.get());
	}));

	return <Popup style={{
		inset: 0,
		transition: `opacity ${m.currentDelay}ms ease-in-out`,
		opacity: shown.map(shown => shown ? 1 : 0),
		pointerEvents: shown.map(shown => shown ? null : 'none'),
	}}>
		<div theme='modalOverlay'
			onClick={() => !m.props.noClickEsc ? m.close() : null} />
		<div theme='modalWrapper'>
			<Paper>
				<div theme='row_spread'>
					<Typography
						type='h2'
						label={m.observer.path(['props', 'label'])
							.map(l => l ? l : '')}
					/>
					<Button
						type='icon'
						icon={<Icon name='x' size={30} />}
						onClick={() => m.close()}
					/>
				</div>
				{children}
			</Paper>
		</div>
	</Popup>;
});

export const ModalContext = createContext(() => null, (value) => {
	const { modals, ...props } = value;
	const Modal = OObject({
		modals,
		props: OObject({}),
		open: ({ name, template = DefaultTemplate, ...props }) => {
			Modal.current = name;
			Modal.template = template;
			Object.assign(Modal.props, props);
		},
		close: () => {
			Modal.current = null;

			// TODO: Cleanup somehow? idk how from here
			Modal.closeSignal.effect(s => {
				if (s && !Modal.current) {
					setTimeout(() => {
						Modal.template = DefaultTemplate;
						Object.keys(Modal.props).forEach(key => {
							delete Modal.props[key];
						});
					}, Modal.currentDelay)
				}
			});
		},
		current: null,
		currentDelay: 150,
		template: DefaultTemplate,
		...props,
	});

	return Modal;
});

export const Modal = ModalContext.use(m => ThemeContext.use(h => {
	const Modal = (_, cleanup) => {
		const aniCurrent = Observer.mutable(null);
		cleanup(m.observer.path('current').effect(current => {
			if (current) aniCurrent.set(current);
			else {
				const timeout = setTimeout(() => aniCurrent.set(null), m.currentDelay);
				return () => clearTimeout(timeout);
			}
		}));

		return Observer.all([m.observer.path('template'), aniCurrent])
			.map(([T, c]) => {
				if (!c) return null;

				m.closeSignal = m.observer.path('current').map(current => {
					if (!current) return true;
					else return current !== c;
				});

				let Modal = null;
				if (m && m.modals && typeof c === 'string' && c in m.modals) {
					Modal = m.modals[c];
				} else {
					console.error(`Modal with '${c}' does not exist in modals list.`);
				}

				return <T m={m}><Modal /></T>;
			});
	};

	return Modal;
}));
