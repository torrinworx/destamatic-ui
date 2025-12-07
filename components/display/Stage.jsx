import { OArray, OObject, Observer } from 'destam';

import Theme from '../utils/Theme';
import is_node from '../../ssg/is_node';
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

/**
 * stageRegistry
 *
 * Global, observable registry of all active Stage instances.
 * Every Stage created via `StageContext` can register itself here,
 * and unregister on cleanup/unmount.
 *
 * This is mainly for debugging all open stages, building global controls
 * (close all, inspect state, etc.), external tools that need to observe
 * or react to stage lifecycle.
 * 
 * Consumers should treat this as read-only from the outside. To close a
 * stage, call `stage.close()` or manipulate its own StageContext API.
 * In general avoid mutating `stageRegistry` directly (push/splice).
 * 
 * Usage:
 * ```js
 * import { stageRegistry } from 'destamatic-ui';
 *
 * // Log all active stages
 * stageRegistry.observer.watch(event => {
 *     if (event instanceof Insert) {
 *         console.log('Stage Opened', event.value, 'at ref', event.ref);
 *     } else if (event instancof Delete) {
 *         console.log('Stage Closed', event.value, 'at ref', event.ref);
 *     } else {
 *         console.log(event.constructor.name, 'prev=', event.prev, 'value=', event.value);
 *     }
 * });
 *
 * // Close all open stages
 * stageRegistry.forEach(stage => stage.close());
 * ```
 */
export const stageRegistry = OArray([]);

/**
 * StageContext
 * 
 * A specialized context that manages a hierarchical "stage" system
 * (think modal / wizard / pages / route-like flows).
 *
 * Each `<StageContext>` node creates a `Stage` object for its subtree. Stages
 * can:
 * - Define available "acts" (named stage components)
 * - Control which act is currently open via `Stage.open` / `Stage.close`
 * - Optionally register themselves into the global `stageRegistry`
 * - Compose nested stages (children) for route-like navigation
 *
 * All properties on the `Stage` object are ephemeral and bound to the current
 * mount cycle.

 * Shape of `raw` (value passed into `<StageContext>`):
 * ```ts
 * {
 *   acts?: { [name: string]: ReactLikeComponent },
 *   onOpen?: ({ name, template, props }) => { name?, template?, props? },
 *   template?: ReactLikeComponent, // wrapper used when rendering acts
 *   initial?: string | null,       // initial act to open
 *   ssg?: boolean,                 // static-site-generation hint
 *   register?: boolean,            // auto-register in stageRegistry (default: true)
 *   ...globalProps: any            // props forwarded to acts on open
 * }
 * ```
 * Usage example:
 * ```jsx
 * export const StageContext = createContext(
 *   () => null,
 *   (raw, parent, children) => { ... }
 * );
 *
 * // Provide a stage:
 * <StageContext value={{
 *   acts: { ModalA, ModalB },
 *   initial: 'ModalA',
 *   onOpen: ({ name, template, props }) => ({
 *     name,
 *     template,
 *     props: { ...props, injected: true }
 *   })
 * }}>
 *   <Stage/> // will render the active act wrapped in the current template.
 * </StageContext>
 * ```
 */
export const StageContext = createContext(
	() => null,
	(raw, parent, children) => {

		const {
			acts,
			onOpen,
			template = Default,
			initial,
			ssg = false,
			register = true,
			...globalProps
		} = raw || {};

		const Stage = OObject({
			acts,
			template,
			/**
			 * Open a stage "act" (and optionally a nested route of child stages).
			 *
			 * Resolves the target act, applies the `onOpen` hook (if defined),
			 * updates `Stage.current`, `Stage.template`, `Stage.props`, and
			 * optionally forwards the remaining route to the first child stage.
			 *
			 * @param {Object} options
			 * @param {string|string[]} options.name
			 *   Act name or route to open.
			 *   - `"ActA"` opens the `ActA` act on this Stage.
			 *   - `"Parent/Child"` or `["Parent", "Child"]` will open `Parent`
			 *     on this Stage and forward `"Child"` to the first child Stage.
			 * @param {Function} [options.template=Stage.template]
			 *   Optional template component to wrap the act. If provided, it
			 *   replaces the current `Stage.template` for this open.
			 * @param {Function} [options.onClose]
			 *   Optional callback fired when this act is no longer current.
			 *   It is wired to `Stage.observer.path('current')` and runs once
			 *   `current` changes away from the opened act.
			 * @param {Object} [options.props]
			 *   Extra props merged into `Stage.props` for this open:
			 *   `{ ...globalProps, ...props }`.
			 *
			 * Behavior:
			 * - Normalizes `name` into a string array route.
			 * - Runs `Stage.onOpen({ name, template, props })` if defined,
			 *   allowing it to override `name`, `template`, and `props`.
			 * - Sets:
			 *   - `Stage.props`
			 *   - `Stage.template`
			 *   - `Stage.current` to the first segment of the route.
			 * - If there are remaining route segments and children exist,
			 *   calls `children[0].value.open({ name: remaining, ...globalProps })`.
			 * - If `onClose` is passed, wires it to run when `current` moves
			 *   off this act.
			 *
			 * @example
			 * // Open an act:
			 * Stage.open({ name: 'LoginModal' });
			 *
			 * // Open nested route "Root/StepOne/StepTwo":
			 * Stage.open({ name: 'Root/StepOne/StepTwo' });
			 *
			 * // Override template and handle close:
			 * Stage.open({
			 *   name: 'Settings',
			 *   template: CustomTemplate,
			 *   onClose: () => console.log('Settings closed'),
			 *   props: { userId: 123 }
			 * });
			 */
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
					children[0].value.open({ name: name, ...globalProps }); // Forward props? Prop handling? idk? Maybe special props param, endRouteProps? props only intended to be used as regular porps if the name.length === 0?
				}

				if (onClose) {
					Stage.observer
						.path('current')
						.defined(val => val !== name)
						.then(onClose);
				}
			},
			/**
			 * Close the currently active act on this Stage.
			 */
			close: () => {
				Stage.current = null;
			},

			/**
			 * Reset transient Stage state after an act finishes.
			 *
			 * Currently restores `Stage.template` back to the original
			 * `template` captured when this Stage was created.
			 */
			cleanup: () => {
				Stage.template = template;
			},

			/**
			 * Register this Stage in the global `stageRegistry`.
			 *
			 * Adds the Stage once (by identity) so external tooling can
			 * inspect or control all active stages.
			 */
			register: () => {
				if (!stageRegistry.includes(Stage)) {
					stageRegistry.push(Stage);
				}
			},

			/**
			 * Unregister this Stage from the global `stageRegistry`.
			 *
			 * Removes the Stage by matching its `id`. Typically called
			 * during cleanup/unmount.
			 */
			unregister: () => {
				const idx = stageRegistry.findIndex(
					entry => entry && entry.id === Stage.id
				);
				if (idx !== -1) {
					stageRegistry.splice(idx, 1);
				}
			},
			parentRoute: parent ? parent?.current : null,
			current: initial ? initial : null,
			currentDelay: 150,
			onOpen,
			initial,
			ssg: !!ssg, // TODO: Hook this flag up with the render() function to filter out non ssg acts? 
			globalProps,
			children,
			parent,
		});

		if (register) Stage.register();

		return Stage;
	}
);

/**
 * Stage
 *
 * Render component for a `StageContext` instance.
 *
 * It subscribes to the underlying `Stage`'s reactive state and:
 * - Watches `Stage.current` to decide which act to render.
 * - Wraps the active act in the current `Stage.template`.
 * - Handles Node/SSR mode (`process.versions.node`) differently from
 *   browser mode (with animation / delayed cleanup via `currentDelay`).
 * - Wires a `closeSignal` observable into the template so it can react
 *   when the act is closing or has closed.
 *
 * Usage:
 * ```jsx
 * // Inside a <StageContext> provider with configured acts:
 * <Stage />
 *
 * // Example StageContext value:
 * <StageContext value={{
 *   acts: { Login, Register },
 *   initial: 'Login'
 * }}>
 *   <Stage />
 * </StageContext>
 *
 * // Somewhere else you can open acts via the Stage object:
 * StageContext.use(stage => {
 *     stage.open({ name: 'Register' });
 * }):
 * ```
 */
export const Stage = StageContext.use(s => ThemeContext.use(h => (_, cleanup) => {
	if (is_node() || s.props?.skipSignal) {
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
