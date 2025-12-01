import { OObject, Observer } from 'destam';

import Theme from '../utils/Theme';
import createContext from '../utils/Context';
import ThemeContext from '../utils/ThemeContext';

import Default from '../stage_templates/Default';

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

export const __STAGE_CONTECT_REGISTRY = [];
export const __STAGE_SSG_DISCOVERY_ENABLED__ = { value: true };

// createContext passes transform(raw, parentValue) as "value" to consumers.
// We name the args to make that explicit.
export const StageContext = createContext(
	() => null,
	(raw, parentStage) => {
		const {
			stages,
			onOpen,
			template = Default,
			initial,
			ssg = false,
			route,
			// we'll capture and ignore any extra fields for now
			...globalProps
		} = raw || {};

		// We'll add metadata here
		const Stage = OObject({
			stages,
			template,
			open: ({ name, template = Stage.template, onClose, ...props }) => {

				if (Stage.onOpen) {
					const result = Stage.onOpen({ name, template, props });

					name = result?.name || name;
					template = result?.template || template;
					props = result?.props || props;
				}

				Stage.props = { ...globalProps, ...props };
				Stage.template = template;
				Stage.current = name;

				if (onClose) {
					Stage.observer
						.path('current')
						.defined(val => val !== name)
						.then(onClose);
				}
			},
			close: () => {
				Stage.current = null;
			},
			cleanup: () => {
				Stage.template = template;
			},
			current: initial ? initial : null,
			currentDelay: 150,
			onOpen,
			route,
			initial,
		});

		if (typeof StageContext.__nextId === 'undefined') {
			StageContext.__nextId = 1;
		}
		Stage.id = StageContext.__nextId++;

		// but use a simple parentId for SSG / tree building
		Stage.parentId =
			parentStage && typeof parentStage.id === 'number'
				? parentStage.id
				: null;

		Stage.ssg = !!ssg;
		Stage.globalProps = globalProps;

		if (typeof process !== 'undefined' && Stage.ssg) {
			if (!__STAGE_CONTECT_REGISTRY.includes(Stage)) {
				__STAGE_CONTECT_REGISTRY.push(Stage);
			}
		}

		return Stage;
	}
);

export const Stage = StageContext.use(s => ThemeContext.use(h => (_, cleanup) => {
	const isNode = typeof process !== 'undefined' && process.versions?.node;
	if (isNode) {

		return s.observer.path('current').map((c) => {
			if (!c) return null;

			let StageComp = null;
			if (s && s.stages && typeof c === 'string' && c in s.stages) {
				StageComp = s.stages[c];
			} else {
				console.error(
					`Stage component with '${c}' does not exist in stages list.`,
					'available=',
					Object.keys(s.stages || {})
				);
				return null;
			}

			const Template = s.template;
			const closeSignal = s.observer.path('current').map((current) => current !== c);

			return <Template closeSignal={closeSignal} s={s} m={s}>
				<StageComp stage={s} modal={s} {...s.props} />
			</Template>;
		});
	}

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

	return Observer.all([s.observer.path('template').unwrap(), aniCurrent])
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
				console.error(`Stage component with '${c}' does not exist in stages list.`);
			}

			return <Template closeSignal={closeSignal} s={s} m={s}>
				<Stage stage={s} modal={s} {...s.props} />
			</Template>;
		});
}));
