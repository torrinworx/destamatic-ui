import { Observer } from 'destam-dom';

import Icon from '../display/Icon';
import Popup from '../utils/Popup';
import Paper from '../display/Paper';
import Button from '../inputs/Button';
import ThemeContext from '../utils/ThemeContext';
import { Typography } from '../display/Typography';

const Modal = ThemeContext.use(h => ({ s, closeSignal, children }, cleanup, mounted) => {
	const shown = Observer.mutable(false);

	const handleEscape = (e) => {
		if (e.which === 27) {
			e.preventDefault();
			s.current = false;
		}
	};

	mounted(() => {
		queueMicrotask(() => {
			setTimeout(() => shown.set(true), 10);
		});
		if (!s.props.noEsc) {
			window.addEventListener('keydown', handleEscape);
			cleanup(() => {
				window.removeEventListener('keydown', handleEscape);
			});
		}
	});

	cleanup(closeSignal.watch(() => {
		shown.set(!closeSignal.get());
	}));

	return <Popup style={{
		inset: 0,
		transition: `opacity ${s.currentDelay}ms ease-in-out`,
		opacity: shown.map(shown => shown ? 1 : 0),
		pointerEvents: shown.map(shown => shown ? null : 'none'),
	}}>
		<div theme='stageOverlay'
			onClick={() => !s.props.noClickEsc ? s.close() : null} />
		<div theme='stageWrapper'>
			<Paper>
				<div theme='row_spread'>
					<Typography
						type='h2'
						label={s.observer.path(['props', 'label'])
							.map(l => l ? l : '')}
					/>
					<Button
						type='icon'
						icon={<Icon name='x' size={30} />}
						onClick={() => s.close()}
					/>
				</div>
				{children}
			</Paper>
		</div>
	</Popup>;
});

export default Modal;
