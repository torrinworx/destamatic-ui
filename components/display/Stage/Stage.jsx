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
			currentDelay = 150,
			...globalProps
		} = raw || {};

		const isRoot = !parent || typeof parent !== 'object';

		// FIX THIS WARNING: only show warning if it's detected that the truncated initial has a child stage. 
		// if (isRoot && urlRouting && truncateInitial) {
		// 	console.warn(
		// 		'[StageContext] urlRouting on the root + truncateInitial=true is usually incompatible. ' +
		// 		'Truncating means the URL can\'t represent deeper state past initial.'
		// 	);
		// }

		// descendant warning (when root uses routing)
		if (!isRoot && truncateInitial) {
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

			// IMPORTANT: urlProps belong to the *leaf* stage only.
			// Intermediate stages should clear urlProps to prevent leaking.
			urlProps: {},

			open: ({ name, template = Stage.template, onClose, urlProps = {}, ...props }) => {
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

				const opened = name[0];
				const tail = name.slice(1);

				// Leaf-only query ownership:
				Stage.urlProps = tail.length ? {} : (urlProps || {});

				Stage.current = opened;


				if (tail.length > 0) {
					if (children.length > 1) {
						console.warn(
							`Expected only 1 child stage for route ${tail[0]}, found ${children.length}. Stage trees assume a single child StageContext per act.\n`,
							children
						);
					}

					// child context isn't guaranteed to be mounted yet
					queueMicrotask(() => {
						children[0]?.value?.open({
							name: tail,
							urlProps,
							...globalProps,
							...props
						});
					});
				} else {
					// Route ends here: clear ALL descendant urlProps so they can't leak back into the URL.
					queueMicrotask(() => {
						const child = children[0]?.value;
						if (!child) return;

						const clearDescendants = (stg) => {
							stg.urlProps = {};
							const next = stg.children?.[0]?.value;
							if (next) clearDescendants(next);
						};

						clearDescendants(child);

						child.observer
							.path('current')
							.set(child.initial ? child.initial : null);
					});
				}

				if (onClose) {
					Stage.observer.path('current').defined(val => val !== opened).then(onClose);
				}
			},

			close: () => {
				Stage.current = null;
				Stage.urlProps = {};
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

			parentRoute: parent ? parent?.current : null,
			current: initial ? initial : null,
			currentDelay,
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

			let current = parent;
			while (current) {
				if (current.fallback && current.acts && current.fallback in current.acts) {
					return current.acts[current.fallback];
				}
				current = current.parent;
			}

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
			const urlProps = s.urlProps || {};

			return <Template closeSignal={closeSignal} s={s} m={s}>
				<StageComp stage={s} modal={s} urlProps={urlProps} {...urlProps} {...s.props} />
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

			const urlToSegments = (pathname) =>
				pathname.split('/').filter(Boolean);

			const urlToQuery = (search) =>
				Object.fromEntries(new URLSearchParams(search).entries());

			const applySegmentsToStageChain = (stage, segments, urlProps) => {
				if (!segments.length) {
					if (!stage.current && stage.initial) {
						stage.open({ name: [stage.initial], urlProps: {} });
					}
					return;
				}

				const [head, ...tail] = segments;
				stage.open({ name: [head, ...tail], urlProps });
			};

			const buildPathFromStage = (root) => {
				const segs = [];

				let stg = root;
				let leaf = root;

				while (stg && stg.current) {
					leaf = stg;

					// truncateInitial means "do not include this segment and stop representing deeper state"
					if (stg.initial && stg.truncateInitial && stg.current === stg.initial) {
						break;
					}

					segs.push(stg.current);

					const child = stg.children?.[0]?.value;
					if (!child) break;
					stg = child;
				}

				const qs = new URLSearchParams(leaf?.urlProps || {}).toString();
				const path = '/' + segs.join('/');
				return qs ? `${path}?${qs}` : path;
			};

			let urlWriteScheduled = false;
			let pendingUrl = null;

			// track last committed pathname so query-only changes don't create new entries
			let lastCommittedPathname = window.location.pathname;

			const commitUrl = () => {
				urlWriteScheduled = false;

				const path = pendingUrl || '/';
				pendingUrl = null;

				const current = window.location.pathname + window.location.search;
				if (current === path) return;

				const u = new URL(path, window.location.origin);
				const nextPathname = u.pathname;
				const nextFull = u.pathname + u.search;

				// If only the query changed (same pathname), replace (don't push).
				// This prevents the "/gig" then "/gig?id=123" double-entry problem.
				const samePathname = nextPathname === lastCommittedPathname;

				if (samePathname) {
					history.replaceState({ route: nextFull }, document.title || nextFull, nextFull);
				} else {
					history.pushState({ route: nextFull }, document.title || nextFull, nextFull);
					lastCommittedPathname = nextPathname;
				}
			};

			const syncUrl = () => {
				if (isPopState) return;

				pendingUrl = buildPathFromStage(s) || '/';

				if (!urlWriteScheduled) {
					urlWriteScheduled = true;
					queueMicrotask(commitUrl);
				}
			};

			const syncStage = () => {
				isPopState = true;

				const segments = urlToSegments(window.location.pathname);
				lastCommittedPathname = window.location.pathname;

				const urlProps = urlToQuery(window.location.search);

				if (segments.length === 0) {
					// If history has a polluted "/?something", nuke it without adding a new entry
					if (window.location.search) {
						history.replaceState(history.state, document.title, window.location.pathname);
					}

					if (s.initial) {
						// Root should NOT inherit old query params.
						s.open({ name: [s.initial], urlProps: {} });
					} else {
						s.close();
					}
				} else {
					applySegmentsToStageChain(s, segments, urlProps);
				}

				// Keep lock longer to cover queued stage updates that happen after popstate.
				requestAnimationFrame(() => requestAnimationFrame(() => {
					isPopState = false;
				}));
			};

			// Initial URL -> Stage
			syncStage();

			// Stage tree -> URL
			cleanup(
				s.observer
					.tree('children')
					.path('value')
					.path('current')
					.effect(() => syncUrl())
			);

			cleanup(
				s.observer
					.path('current')
					.effect(() => syncUrl())
			);

			cleanup(
				s.observer
					.tree('children')
					.path('value')
					.path('urlProps')
					.effect(() => syncUrl())
			);

			cleanup(
				s.observer
					.path('urlProps')
					.effect(() => syncUrl())
			);

			// URL Change -> Stage Change
			const onPop = () => syncStage();
			window.addEventListener('popstate', onPop);
			cleanup(() => window.removeEventListener('popstate', onPop));
		}
	});

	cleanup(() => s.unregister());

	return Observer.all([
		s.observer.path('template').unwrap(),
		aniCurrent,
		s.observer.path('urlProps').unwrap()
	]).map(([Template, c, urlProps]) => {
		if (!c) return null;

		const closeSignal = s.observer.path('current').map(current => {
			if (!current) return true;
			else return current !== c;
		});

		let StageComp = null;
		if (s && s.acts && typeof c === 'string' && c in s.acts) {
			StageComp = s.acts[c];
		} else {
			StageComp = s.fallbackAct.get();
			console.error(`Stage component with '${c}' does not exist in acts list.`);
		}

		return <Template closeSignal={closeSignal} s={s} m={s}>
			<StageComp stage={s} urlProps={urlProps || {}} {...(urlProps || {})} {...s.props} />
		</Template>;
	});
}));
