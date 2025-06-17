import { OObject, Observer } from 'destam';

import Icon from './Icon';
import Popup from '../utils/Popup';
import Theme from '../utils/Theme';
import Paper from './Paper';
import Button from '../inputs/Button';
import Typography from './Typography';
import createContext from '../utils/Context';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	stageOverlay: {
		background: 'rgba(0, 0, 0, 0.7)',
		height: '100vh',
		width: '100vw'
	},
	stageWrapper: {
		top: '50%',
		left: '50%',
		position: 'absolute',
		transform: 'translate(-50%, -50%)',
	}
});

const DefaultTemplate = ThemeContext.use(h => ({ s, closeSignal, children }, cleanup, mounted) => {
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

export const StageContext = createContext(() => null, (value) => {
	const { stages, template: defaultTemplate = DefaultTemplate, ...globalProps } = value;

	const Stage = OObject({
		stages,
		template: defaultTemplate,
		open: ({ name, template = Stage.template, onClose, ...props }) => {
			Stage.props = { ...globalProps, ...props };
			Stage.template = template;
			Stage.current = name;

			if (onClose) {
				Stage.observer.path('current').defined(val => val !== name).then(onClose);
			}
		},
		close: () => {
			Stage.current = null;
		},
		cleanup: () => {
			Stage.template = defaultTemplate;
		},
		current: null,
		currentDelay: 150,
	});

	return Stage;
});

export const Stage = StageContext.use(s => ThemeContext.use(h => (_, cleanup) => {
	const aniCurrent = Observer.mutable(null);
	cleanup(s.observer.path('current').effect(current => {
		if (current) aniCurrent.set(current);
		else {
			const timeout = setTimeout(() => {
				s.cleanup();
				aniCurrent.set(null);
			}, s.currentDelay);

			return () => clearTimeout(timeout);
		}
	}));

	return Observer.all([s.observer.path('template'), aniCurrent])
		.map(([Template, c]) => {
			if (!c) return null;

			const closeSignal = s.observer.path('current').map(current => {
				if (!current) return true;
				else return current !== c;
			});

			let Stage = null;
			if (s && s.stages && typeof c === 'string' && c in s.stages) {
				Stage = s.stages[c];
			} else {
				console.error(`Stage with '${c}' does not exist in stages list.`);
			}

			return <Template closeSignal={closeSignal} s={s} m={s}>
				<Stage stage={s} modal={s} {...s.props} />
			</Template>;
		});
}));
