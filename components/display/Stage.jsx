import { OObject, OArray, Observer } from 'destam';

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

export const _STAGE_CONTEXT_REGISTRY = OArray([]);

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
			...globalProps
		} = raw || {};

		const Stage = OObject({
			stages,
			template,
			open: ({ name, template = Stage.template, onClose, ...props }) => { // todo: name accepts array of strings
				if (typeof name === 'string') {
					name = name.includes("/") ? name.split("/").filter(Boolean) : [name];
				}

				if (Stage.onOpen) {
					const result = Stage.onOpen({ name, template, props });
					name = result?.name || name;
					template = result?.template || template;
					props = result?.props || props;
				}

				Stage.props = { ...globalProps, ...props };
				Stage.template = template;
				Stage.current = name.shift(); // open here, remove opened stage from name/route.

				if (name.length > 0) {
					const children = _STAGE_CONTEXT_REGISTRY.filter(entry => {
						return entry.parentId === Stage.id
					});

					if (children.length > 1) {
						console.warn(
							`Expected only 1 child stage for route ${name[0]}, found ${children.length}.\n`,
							children
						);
					}

					children[0].open({ name: name }); // Forward props? Prop handling? idk? 
				}

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
			register: () => {
				if (typeof StageContext.__nextId === 'undefined') {
					StageContext.__nextId = 1;
				}
				Stage.id = StageContext.__nextId++;

				Stage.parentId =
					parentStage && typeof parentStage.id === 'number'
						? parentStage.id
						: null;

				if (!_STAGE_CONTEXT_REGISTRY.includes(Stage)) {
					_STAGE_CONTEXT_REGISTRY.push(Stage);
				}
			},
			unregister: () => {
				const idx = _STAGE_CONTEXT_REGISTRY.findIndex(
					entry => entry && entry.id === Stage.id
				);
				console.log("cleanup: ", idx, _STAGE_CONTEXT_REGISTRY[idx].current);
				if (idx !== -1) {
					_STAGE_CONTEXT_REGISTRY.splice(idx, 1);
				}
			},
			// todo: tree/discover method to discover all children stages? 
			current: initial ? initial : null,
			currentDelay: 150,
			onOpen,
			route,
			initial,
		});

		Stage.ssg = !!ssg; // TODO: Hook this flag up with the render() function to filter out non ssg stages? 
		Stage.globalProps = globalProps;
		Stage.register();

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
				console.log("THIS HAPPENS");
				s.cleanup();
				aniCurrent.set(null);
			}, s.currentDelay);

			return () => clearTimeout(timeout);
		}
	}));

	cleanup(() => s.unregister());

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
