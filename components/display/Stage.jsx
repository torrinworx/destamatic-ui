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
			urlRouting = false,
			...globalProps
		} = raw || {};

		let current;

		if (parent.pending) {
			current = parent.pending;
		} else if (initial) {
			current = initial
		}

		const Stage = OObject({
			acts,
			template,
			props: globalProps,
			open: ({ name, template = Stage.template, onClose, ...props }) => {
				if (typeof name === 'string') {
					name = name.includes("/")
						? name.split("/").filter(Boolean)
						: [name];
				} else if (!Array.isArray(name)) {
					throw new Error(`Stage.open: "name" must be string or array, got ${typeof name}`);
				}

				// Allow onOpen hook to adjust route/template/props
				if (Stage.onOpen) {
					const result = Stage.onOpen({ name, template, props });
					if (result) {
						if (result.name) name = result.name;
						if (result.template) template = result.template;
						if (result.props) props = result.props;
					}
				}

				// Ensure name is still an array after onOpen
				if (typeof name === 'string') {
					name = name.includes("/")
						? name.split("/").filter(Boolean)
						: [name];
				}

				Object.assign(Stage.props, props)
				Stage.template = template;
				Stage.current = name.shift(); // open here, remove opened stage from name/route.

				if (name.length > 0) {
					if (children.length > 1) {
						console.warn(
							`Expected only 1 child stage for route ${name[0]}, found ${children.length}.\n`,
							children
						);
					}
					Stage.pending = name; // set current stage pending, if child stage mounts, it will read pending and self open the correct act.
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
			current,
			currentDelay: 150,
			onOpen,
			initial,
			ssg: !!ssg,
			children,
			parent,
			urlRouting: !!urlRouting,
			pending: null,

		});

		if (register) Stage.register();

		return Stage;
	}
);

export const Stage = StageContext.use(s => ThemeContext.use(h => (_, cleanup, mounted) => {
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


	// Get the current url path.
	const getUrlPath = () => {
		const raw = window.location.pathname || '/';
		const trimmed = raw.endsWith('/') && raw.length > 1
			? raw.slice(0, -1)
			: raw;
		if (trimmed === '/') return [];
		return trimmed
			.slice(1)
			.split('/')
			.map(x => x.trim())
			.filter(Boolean);
	};

	mounted(() => {
		if (s.urlRouting && typeof s.parent !== 'object') { // This code only runs in the 'root' stage of a given stage tree.
			let isPopState = false;

			// on change in the url (direct navigation to a url, forward/backward, etc), update current of all stages and navigate to it.
			const syncStage = () => {
				isPopState = true;

				const segments = getUrlPath();
				console.log(segments);

				let stage = s
				const name = []
				let count = 0;

				// How the fuck do I do this? There is no possible way to know which stage route I need given a url,
				// especially if I want 'inital' stages to act as roots of a given route???
				while (stage) {
					console.log(stage.initial, stage.current, stage.children);

					console.log(segments[count] in stage.acts);

					if (segments[count] in stage.acts) {
						name.push(segments[count]);
					} else {
						name.push(stage.initial);
					}
					stage = null;
				};

				console.log("NAME: ", name);

				// Create a valid stage route from the url, account for 'initial' stage values being roots of a given slug.
				// const name = stageFromUrl(s, segments);

				// s.open({ name })

				queueMicrotask(() => {
					isPopState = false;
				});
			};

			// on change in any stages current value, update the url.
			const syncUrl = () => {
				if (isPopState) return;

				// Create a valid url from stages, account for 'initial' stage values as being roots of a given slug.
				// const path = urlFromStage(s);
				console.log(path);

				if (window.location.pathname !== path) {
					history.pushState({ route: segs }, document.title || path, path);
				}
			};

			// Initial URL -> Stage
			syncStage();

			// Stage (Any) Change -> URL Change
			cleanup(
				/*
				Stage contexts are infinitely nestable, so this watches for changes on 
				each stages child array and runs syncUrl.

				The expectation that syncUrl will construct a valid url from the root stage,
				recursing through root.children and building a valid url based on a combination
				of current act, and inital act.
				*/
				s.observer
					.tree('children')
					.path('value')
					.path('current')
					.effect(() => {
						syncUrl();
					})
			);

			// URL Change -> Stage Change
			const onPop = () => syncStage();
			window.addEventListener('popstate', onPop);
			cleanup(() => window.removeEventListener('popstate', onPop));
		}
	});

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


/*
Stage Tree definition:


StageContext's can be nested, the intention for this is to create a hierarchical tree structure and build pagination systems
from this.

Stage itself, detects if it's a root by checking if it has any parent stages. If it does not have parent stages, it assumes it's
a root singlton. We still need to implement a warning/check to restrict this root behaviour to a single stage context. But that's
a trivial task for the future.

`acts` are the individual 'pages' that a stage is able to show. `current` is the observer that propegates what act is currently
being shown in a given Stage/StageContext. `initial` is the act that the Stage is expected to show on mount.

Example:
```javascript

const Landing () => <>Landing Page</>;

const Blog = () => {
	const blogConfig = {
		acts: {
			home: '...',
			'post-1': '...',
			'post-2': '...'
		},
		template: ({ children }) => children,
		initial: 'home',
	};

	return <StageContext value={blogConfig}>
		<Stage />
	</StageContext>
};

const App = StageContext.use(rootStage, () => {
	return <>
			<Button
				label="Blog"
				onClick={() => {
					rootStage.open({ name: 'Blog' });
				}}
			/>
			<Button
				label="Landing"
				onClick={() => {
					rootStage.open({ name: 'Landing' });
				}}
			/>
		<Stage />
	</>;
});

const rootConfig = {
	acts: {
		Landing,
		Blog,
	},
	template: ({ children }) => children,
	initial: 'Landing',
};

export default () => <StageContext value={rootConfig}>
	<App />
</StageContext>;
```

This is a working stub example of a stage tree. The root stage in App get's mounted and immediately displays the initial 'Landing' component.
act.

When the user clicks a button in the App, rootStage.open() is triggered and the button determins the act the rootStage should open.

When the clicks the 'Blog' button, here is the logical flow of what happens stage by stage:
1. rootStage.open({name: 'Blog'}); is called and we open the 'Blog' act, mounting the Blog component.
2. Blog component mounts to the dom. And immediately opens it's `initial` child act 'home'.

.open also supports something called act routing:
```javascript
<Button
	label="Blog"
	onClick={() => {
		rootStage.open({ name: 'Blog/post-1' });
	}}
/>
```

Meaning we can 

*/

