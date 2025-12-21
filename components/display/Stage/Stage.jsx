import { OArray, OObject, Observer } from 'destam';

import Theme from '../../utils/Theme/Theme.jsx';
import is_node from '../../../ssg/is_node';
import createContext from '../../utils/Context/Context.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';
import Default from '../../stage_templates/Default/Default.jsx';

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
			fallback,
			ssg = false,
			register = true,
			urlRouting = false,
			truncateInitial = false,
			...globalProps
		} = raw || {};

		const isRoot = !parent || typeof parent !== 'object';

		// stage-local warning
		if (isRoot && urlRouting && truncateInitial) {
			console.warn(
				'[StageContext] urlRouting on the root + truncateInitial=true is usually incompatible. ' +
				'Truncating means the URL can\'t represent deeper state past initial.'
			);
		}

		// descendant warning (when root uses routing)
		if (!isRoot && truncateInitial) {
			// walk up to find root + whether routing is enabled there
			let p = parent;
			while (p?.parent && typeof p.parent === 'object') p = p.parent;
			const root = p;

			if (root?.urlRouting) {
				console.warn(
					'[StageContext] truncateInitial=true on a child stage while root urlRouting is enabled. ' +
					"This stage's initial will be URL-implicit and routing won't be able to represent child state under it.",
					{ stageConfig: raw, root }
				);
			}
		}

		const Stage = OObject({
			acts,
			template,
			props: globalProps,

			/*
			name: Can be either a / separated list of 'act' names, or an array of 'act' names. aka keys in the act lists of various stages in a stage tree.
			*/
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

				Object.assign(Stage.props, props);
				Stage.template = template;

				const opened = name.shift();
				Stage.current = opened;

				if (name.length > 0) {
					if (children.length > 1) {
						console.warn(
							`Expected only 1 child stage for route ${name[0]}, found ${children.length}. Stage trees assume a single child StageContext per act.\n`,
							children
						);
					}
					// child context isn't garunteed to be mounted yet because current is fed into a signaled delay with anti current in Stage:
					queueMicrotask(() => {
						children[0].value.open({ name, ...globalProps });
					});
				} else {
					queueMicrotask(() => {
						children[0]?.value.observer
							.path('current')
							.set(children[0].value.initial ? children[0].value.initial : null);
					});
				}

				if (onClose) {
					Stage.observer.path('current').defined(val => val !== opened).then(onClose);
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
			fallback,
			fallbackAct: null,
			ssg: !!ssg,
			children,
			parent,
			urlRouting: !!urlRouting,
			truncateInitial: !!truncateInitial,
		});

		Stage.fallbackAct = Stage.observer.path('fallback').map(f => {
			if (f && Stage.acts && f in Stage.acts) return Stage.acts[f];

			// If this stage has a local fallback string, and it's in this stage's acts, use it
			// Otherwise, walk up the parents
			let current = parent;
			while (current) {
				if (current.fallback && current.acts && current.fallback in current.acts) {
					return current.acts[current.fallback];
				}
				current = current.parent;
			}

			// No fallback found anywhere
			return null;
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

	mounted(() => {
		// Only the root Stage of a tree should manage URL routing
		if (s.urlRouting && typeof s.parent !== 'object') {
			let isPopState = false;

			// '/blog/post-1/' -> ['blog', 'post-1']
			const urlToSegments = (pathname) =>
				pathname.split('/').filter(Boolean);

			// Walk a stage chain and set .current along the way
			// segments: remaining route parts for this and child stages
			const applySegmentsToStageChain = (stage, segments) => {
				if (!segments.length) {
					// If truncating, stop routing here.
					// Keep whatever `current` already is (usually the parent act that mounted this stage),
					// or if nothing is open, fall back to initial.
					if (!stage.current && stage.initial) {
						stage.open({ name: [stage.initial] });
					}
					return;
				}

				// We do NOT want to accidentally treat an initial as explicit route
				// initial is implicit: if a segment equals stage.initial but we still
				// have more segments, it's ambiguous / probably invalid.
				// For now: treat segments[0] as the explicit target act.
				const [head, ...tail] = segments;

				// Open this stage at `head`
				stage.open({ name: [head, ...tail] });
				// `Stage.open` implementation will forward remaining tail
				// into the child stage for us.
			};

			// URL → Stage tree (root)
			const syncStage = () => {
				isPopState = true;

				const segments = urlToSegments(window.location.pathname);

				if (segments.length === 0) {
					// No path segments: go to root initial chain
					if (s.initial) {
						s.open({ name: [s.initial] });
					} else {
						s.close();
					}
				} else {
					applySegmentsToStageChain(s, segments);
				}

				queueMicrotask(() => {
					isPopState = false;
				});
			};

			// Stage tree → URL
			const buildPathFromStage = (stage) => {
				const segs = [];

				const walk = (stg) => {
					const cur = stg.current;
					if (!cur) return;

					if (stg.initial && stg.truncateInitial && cur === stg.initial) return;

					segs.push(cur);

					// otherwise continue walking
					const child = stg.children?.[0]?.value;
					if (child) walk(child);
				};

				walk(stage);
				return '/' + segs.join('/');
			};

			const syncUrl = () => {
				if (isPopState) return;

				const path = buildPathFromStage(s) || '/';
				if (window.location.pathname !== path) {
					history.pushState({ route: path }, document.title || path, path);
				}
			};

			// Initial URL -> Stage
			syncStage();

			// Any nested stage, including root, .current Change -> Change URL
			cleanup(
				s.observer
					.tree('children')
					.path('value')
					.path('current')
					.effect(() => {
						syncUrl();
					})
			);

			cleanup(
				s.observer
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
				Stage = s.fallbackAct.get();
				console.error(`Stage component with '${c}' does not exist in acts list.`);
			}

			return <Template closeSignal={closeSignal} s={s} m={s}>
				<Stage stage={s} {...s.props} />
			</Template>;
		});
}));
