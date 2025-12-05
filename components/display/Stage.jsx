import { OArray, OObject, Observer, UUID, Insert, Delete, Modify, Synthetic } from 'destam';

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

export const stageRegistry = OArray([]);

export const StageContext = createContext(
	() => null,
	(raw, parent, children) => {
		const {
			acts,
			onOpen,
			template = Default,
			initial,
			ssg = false,
			route,
			register = true,
			...globalProps
		} = raw || {};

		const Stage = OObject({
			acts,
			template,
			open: ({ name, template = Stage.template, onClose, ...props }) => {
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
					if (children.length > 1) {
						console.warn(
							`Expected only 1 child stage for route ${name[0]}, found ${children.length}.\n`,
							children
						);
					}
					children[0]?.value?.open({ name: name, ...globalProps }); // Forward props? Prop handling? idk? Maybe special props param, endRouteProps? props only intended to be used as regular porps if the name.length === 0?
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
				if (!stageRegistry.includes(Stage)) {
					stageRegistry.push(Stage);
				}
			},
			unregister: () => {
				const idx = stageRegistry.findIndex(
					entry => entry && entry.id === Stage.id
				);
				if (idx !== -1) {
					stageRegistry.splice(idx, 1);
				}
			},
			current: initial ? initial : null,
			currentDelay: 150,
			onOpen,
			route,
			initial,
			ssg: !!ssg, // TODO: Hook this flag up with the render() function to filter out non ssg acts? 
			globalProps,
		});

		if (register) Stage.register();

		return Stage;
	}
);

export const Stage = StageContext.use(s => ThemeContext.use(h => (_, cleanup) => {
	const isNode = typeof process !== 'undefined' && process.versions?.node;
	if (isNode || s.props?.skipSignal) {
		return s.observer.path('current').map((c) => {
			if (!c) return null;

			let StageComp = null;
			if (s && s.acts && typeof c === 'string' && c in s.acts) {
				StageComp = s.acts[c];
			} else {
				console.error(
					`Stage component with '${c}' does not exist in acts list.`,
					'available=',
					Object.keys(s.acts || {})
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

	cleanup(() => s.unregister());

	return Observer.all([s.observer.path('template').unwrap(), aniCurrent])
		.map(([Template, c]) => {
			if (!c) return null;

			const closeSignal = s.observer.path('current').map(current => {
				if (!current) return true;
				else return current !== c;
			});

			let Stage = null;
			if (s && s.acts && typeof c === 'string' && c in s.acts) {
				Stage = s.acts[c];
			} else {
				console.error(`Stage component with '${c}' does not exist in acts list.`);
			}

			return <Template closeSignal={closeSignal} s={s} m={s}>
				<Stage stage={s} modal={s} {...s.props} />
			</Template>;
		});
}));
