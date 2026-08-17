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

// A route tail whose child stage did not exist yet, kept until one does.
//
// `open({ name: ['admin', 'news'] })` hands 'news' to `children[0]` on a microtask, which
// assumes the child StageContext is already mounted. It often is not: the usual shape is a
// child stage living INSIDE an act that renders behind an async gate (an auth check, a fetch),
// so it appears a tick or a second later and the tail was dropped long before. Two apps grew
// independent workarounds for that (seeding the child's `initial` from window.location,
// restructuring the component to dodge it), which is what makes it worth fixing rather than
// documenting.
//
// A WeakMap rather than a field on the Stage OObject: this is delivery state, not stage state.
// Putting it on the object would publish it to every observer of the stage and put it in reach
// of anything walking the tree, for a value that is meaningless a tick after it is set.
const pendingTails = new WeakMap();

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

		// THE truncateInitial WARNING LIVES IN open(), NOT HERE. See the note there.
		//
		// It used to fire from this spot, on any stage that set the flag under a routed root. But
		// `truncateInitial` means "my initial act contributes no URL segment", which is exactly
		// what a parameterised route wants (/app/<uuid>, not /app/<uuid>/home), so that warned on
		// every correct use. It fired on every /newsletter visit in one app, and the agent-facing
		// docs had to tell people to ignore it, which is the point at which a warning is worse
		// than silence.
		//
		// Moving it one level down, to the child, was not enough either: at construction time a
		// parent is ALWAYS still on its initial act, because routing is applied a microtask
		// later, so the question cannot be answered yet. Measured in a browser on
		// /app/<uuid>/settings/profile, which warned twice while routing perfectly.

		const Stage = OObject({
			acts,
			template,
			props: globalProps,

			// IMPORTANT: urlProps belong to the *leaf* stage only.
			// Intermediate stages should clear urlProps to prevent leaking.
			urlProps: {},

			open: ({ name, template = Stage.template, onClose, urlProps = {}, ...props }) => {
				// AN EXACT ACT WINS OVER THE SEPARATOR. `open('a/b')` is the documented way to
				// reach a nested route, so '/' has to split. But an act may legitimately be NAMED
				// with a slash in it (a package name, a path-shaped key), and splitting those made
				// them unreachable by their own name: `open('@destamatic/ui')` opened
				// '@destamatic', found no such act, and rendered the fallback. Checking the acts
				// map first costs nothing and is unambiguous, because a name that IS an act is
				// never also a route through one.
				if (typeof name === 'string') {
					name = Stage.acts && name in Stage.acts
						? [name]
						: (name.includes("/") ? name.split("/").filter(Boolean) : [name]);
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

				// The only arrangement where a stage holds state the URL cannot represent: this
				// stage is nested under one that truncates, that parent is sitting on the very
				// act it truncates (so it contributes no segment), and this stage has moved off
				// its own initial act (so it has something to lose). A refresh drops it.
				//
				// Asked here rather than at construction because only here is the parent's route
				// settled: a parent sets its own `current` synchronously and hands the tail down
				// on a microtask, so by the time this runs the answer is real.
				if (!isRoot && parent.truncateInitial && parent.current === parent.initial
					&& Stage.initial && opened !== Stage.initial) {
					let p = parent;
					while (p?.parent && typeof p.parent === 'object') p = p.parent;

					if (p?.urlRouting) {
						console.warn(
							`[StageContext] '${opened}' cannot be represented in the address bar. `
							+ `This stage is nested under one with truncateInitial=true that is `
							+ `currently on its initial act, so there is no segment to hang this `
							+ `state off and a refresh will lose it.`,
							{ stage: Stage, parent }
						);
					}
				}


				// Any tail parked for a child that never arrived belongs to the route we are
				// leaving. Dropping it here is what stops a late child opening a screen the user
				// navigated away from.
				pendingTails.delete(Stage);

				if (tail.length > 0) {
					if (children.length > 1) {
						console.warn(
							`Expected only 1 child stage for route ${tail[0]}, found ${children.length}. Stage trees assume a single child StageContext per act.\n`,
							children
						);
					}

					const deliver = { name: tail, urlProps, ...globalProps, ...props };

					// The child context is not guaranteed to be mounted yet, and when it is not,
					// the tail is KEPT rather than dropped. A child stage that appears later reads
					// it on creation (see the end of this factory). The microtask is still the
					// common path: an act that renders its child stage synchronously has it by the
					// time this runs.
					queueMicrotask(() => {
						const child = children[0]?.value;
						if (child) child.open(deliver);
						else pendingTails.set(Stage, deliver);
					});
				} else if (urlRouting) {
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

						child.current = child.initial;
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

		// The other half of the parked tail. A stage that mounts after its parent routed picks
		// the tail up here, which is the whole fix for a child stage behind an async gate.
		//
		// Read once and deleted, so a later sibling cannot replay it, and deferred so this
		// factory finishes returning before anything opens: `open` touches Stage.props and
		// Stage.current, and the context value is not in the tree yet.
		if (!isRoot) {
			const parked = pendingTails.get(parent);
			if (parked) {
				pendingTails.delete(parent);
				queueMicrotask(() => Stage.open(parked));
			}
		}

		return Stage;
	}
);

export const Stage = StageContext.use(s => ThemeContext.use(h => (_, cleanup, mounted) => {
	if (is_node() || s.props?.skipSignal) {
		return s.observer.path('current').map((c) => {
			if (!c) return null;

			// Same rule as the browser path below, and it has to be the same or a parameterised
			// route renders the fallback in the browser and NOTHING when prerendered. This path
			// used to ignore `fallback` outright, so every SSG'd /s/<slug> page came out empty
			// and only filled in once the client took over.
			let StageComp = null;
			if (s && s.acts && typeof c === 'string' && c in s.acts) {
				StageComp = s.acts[c];
			} else {
				StageComp = s.fallbackAct.get();
				if (!StageComp) {
					console.error(
						`Stage component with '${c}' does not exist in acts list, `
						+ `and no stage in this chain declares a usable fallback.`,
						'available=',
						Object.keys(s.acts || {})
					);
					return null;
				}
			}

			const Template = s.template;
			const closeSignal = s.observer.path('current').map((current) => current !== c);
			const urlProps = s.urlProps || {};

			return <Template closeSignal={closeSignal} s={s} m={s}>
				<StageComp stage={s} modal={s} urlProps={urlProps} {...urlProps} {...s.props} />
			</Template>;
		});
	}

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
			let urlWriteHandle = null;
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
					urlWriteHandle = setTimeout(commitUrl, 0);
				}
			};

			// Tearing this Stage down is not a navigation. destam-dom removes the DOM subtree
			// BEFORE running a component's own cleanups, so a child StageContext splices itself
			// out of `children` while these effects are still live. buildPathFromStage then
			// walks a tree that is mid-teardown, finds no child, and treats the route as ending
			// at the parent, writing a truncated path (/s rather than /s/<slug>) as a pushState.
			// The next load of that short path has no tail to restore, so the deep link is lost
			// and Back lands on the phantom entry.
			//
			// The write is already deferred to a macrotask and teardown is synchronous, so
			// cancelling here always beats it. A Stage that is still mounted never reaches this,
			// which is what keeps a legitimate truncation working: a conditionally mounted child
			// stage going away under a live root SHOULD shorten the URL, and still does.
			cleanup(() => clearTimeout(urlWriteHandle));

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

	const aniCurrent = Observer.mutable(null);
	cleanup(Observer.all([
		s.observer.path('template').unwrap(),
		s.observer.path('current'),
		s.observer.path('urlProps').unwrap()
	]).effect(([template, current, urlProps]) => {
		if (current) aniCurrent.set([template, current, urlProps]);
		else {
			const timeout = setTimeout(() => {
				s.cleanup();
				aniCurrent.set(null);
			}, s.currentDelay);

			return () => clearTimeout(timeout);
		}
	}));

	return aniCurrent.map(state => {
		if (!state) return null;
		const [Template, c, urlProps] = state;

		const closeSignal = s.observer.path('current').map(current => {
			if (!current) return true;
			else return current !== c;
		});

		let StageComp = null;
		if (s && s.acts && typeof c === 'string' && c in s.acts) {
			StageComp = s.acts[c];
		} else {
			StageComp = s.fallbackAct.get();
			// THE FALLBACK IS THE HAPPY PATH, not a failure. A parameterised segment is never an
			// act name: /s/<slug>, /app/<uuid> and /newsletter/<issue> all put DATA where an act
			// goes, and `fallback` is the documented mechanism for rendering it. Logging that as
			// an error meant a correct page load printed one, which trains you to ignore the
			// console on exactly the screens where routing bugs show up.
			//
			// It is still an error when there is nothing to fall back to, because then the stage
			// renders nothing at all and the segment really was a mistake.
			if (!StageComp) {
				console.error(`Stage component with '${c}' does not exist in acts list, `
					+ `and no stage in this chain declares a usable fallback.`);
			}
		}

		// Render nothing rather than throwing. Without this the null falls through to
		// `<StageComp />` and destam-dom raises "Tag name cannot be null or undefined", so the
		// one case that is genuinely a developer error took the whole page down instead of
		// leaving an empty stage and a console message. The prerender path above already
		// returned null here; this is the same answer on the browser side.
		if (!StageComp) return null;

		return <Template closeSignal={closeSignal} s={s} m={s}>
			<StageComp stage={s} urlProps={urlProps || {}} {...(urlProps || {})} {...s.props} />
		</Template>;
	});
}));
