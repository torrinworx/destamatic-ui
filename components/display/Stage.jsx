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

		const Stage = OObject({
			acts,
			template,
			props: globalProps,

			/*
			name: Can be either a / separated list of 'act' names, or an array of 'act' names. aka keys in the act lists of various stages in a stage tree.
			*/
			open: ({ name, template = Stage.template, onClose, ...props }) => {
				console.log(name);
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
						children[0]?.value.open({ name, ...globalProps });
					});
				};

				if (onClose) {
					Stage.observer
						.path('current')
						.defined(val => val !== opened)
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
			ssg: !!ssg,
			children,
			parent,
			urlRouting: !!urlRouting,
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
				// If there are no segments left:
				// - if stage has an initial, use that
				// - otherwise, clear current
				if (!segments.length) {
					if (stage.initial) {
						stage.open({ name: [stage.initial] });
					} else {
						stage.close();
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

					// Skip adding segment if it's equal to initial
					// initial acts are implicit
					if (!stg.initial || cur !== stg.initial) {
						segs.push(cur);
					}

					// Expect max 1 child stage in this "routing chain"
					if (stg.children && stg.children.length > 0) {
						const child = stg.children[0]?.value;
						if (child) walk(child);
					}
				};

				walk(stage);
				return '/' + segs.join('/');
			};

			const syncUrl = () => {
				if (isPopState) return;

				const path = buildPathFromStage(s) || '/';
				console.log('THIS IS PATH: ', path);

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
				console.error(`Stage component with '${c}' does not exist in acts list.`);
			}

			return <Template closeSignal={closeSignal} s={s} m={s}>
				<Stage stage={s} modal={s} {...s.props} />
			</Template>;
		});
}));


// TODO: Convert these ramblings into coherent documentation, or just discard them idk. 
/*
# Stage Tree definition:

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

If the buttons onClick is ran, here is the logical flow of what would happen given the example so far:
1. rootStage would open the 'Blog' act.
2. Blog component mounts, triggering blogStage context to startup and mount.
3. rootStage sends the remaining entries in `name` through blogStage.open({name: name}).
4. blogStage opens 'post-1' act, the remaining segment in the `name`.


# Stage url routing, and it's troubles.

Right now in the above url routing code in the mounted(() => {...}) block is a bunch of bullshit, half implemented. Ignore it. The goal of the 
documentation below is to outline the expected resuling usage and behaviour of a routing system. And at the end specify the actual url -> name
algorithm and name -> url algorithm. We can then feed these into the url watcher

The stage system is designed to be an all in one expansible content display handler. Because of this, it would be immensly useful to have a url
router system installed that automatically resolves url changes to changes in the stage tree and vice versa.

Right now there is a question I must answer before we continue: How do we map urls to stage tree routes? 

To answer that we need to establish the behaviour expected of the url -> name and name -> url converters.

I'll be refering to stage routes as 'name' and urls as 'urls' for clarity. Here are the considerations, and the url/name relationship:

Considerations:
- Stages themselves don't have names, we will only be using the act names in url routes
- Context.jsx provides a children OArray, we can watch each stage contexts 'current' value recursively to construct some kind
	of route from in theory, if we establish how name-route works.
- Ideally, `initial` acts on each stage will be treated as 'roots' of their stage, eg no slug will be added to the url itself.
	This in particular complicates the url -> name logic. maybe we can assume that if an initial act is shown in a child stage,
	there will be no sub acts. Therefore in the url, if there are multiple nested segments: '/blog/page-1', we assume
	stageRoot.current = 'blog' and blogStage.current = 'page-1', then with '/blog' we assume stageRoot.current = 'blog', and 
	stageBlog.current = stageBlog.initial?
- All logic should be recursive, no matter the depth of the stage tree. All functionality should be applicable to all stage tree
	depths.
- Url -> stage and stage -> url resolution/syncing logic should only run on a single designated root stage that doesn't have siblings
	and monitors url changes, applies them to the stage tree, and watches stage tree .current changes, and applies them to the url.
- What I'm having difficulty with is defining this url -> name logic, especially around the complications introduced by requiering 
	`initial` acts to act as roots of a given stages url slug.

# Url format:
/{act}/{act}/{act}/...

Each segment is a stage: `/{act}`

Therefore `/blog` is:
1. assert(rootStage.current = 'blog');

and also, because Blog component is mounted, it has a child StageContext, so there is another step here:
2. assert(blogStage.current = blogStage.initial);

Example:

url: '/blog/post-1' -> name: 'blog/post-1'

This get's resolved to:
```javascript
assert(rootStage.current = 'blog');
```

and
```javascript
assert(blogStage.current === 'post-1');
```

# url and name resolution
We want this sytsem to sync the browser url, including url actions like browser back/forward functionality, with the stage tree's
currently open path of acts. To illustrate this, let's continue with the example:

Now that we have 'blog/post-1' open and mounted, say the user activates a button on the Blog component that does this:
```javascript
blogStage.open({name: blogStage.initial});
```

blogStage.initial is set to 'home', so it's expected that the stage will open 'home' and, the url get's resolved to '/blog, since
initial pages are resolved as the 'root' of their StageContexts. The url is '/blog' but the logic in the stage system is now:
```javascript
assert(rootStage.current === 'blog');
assert(blogStage.current === 'post-1');
// url is '/blog/post-1'

// User clicks button:
blogStage.open({name: blogStage.initial});

assert(rootStage.current === 'blog');
assert(blogStage.current === blogStage.initial === 'home'); // since initial, url resolution doesn't append 'home' to url slug
// url is '/blog'
```

Now say the user clicks the back button in their browser controls, the url is now '/blog/post-1' again. The url resolution system should parse the change in the url, convert
it to a name, and pass it onto the rootStage. Logic flow:
1. Url change detected by rootStage eventListener.
2. url '/blog/post-1' is converted into name: 'blog/post-1'
3. rootStage.open({name: 'blog/post-1'});
4. blog act opens, Blog component mounts, blogStage starts
5. rootStage runs blogStage.open({name: 'post-1'});
6. act 'post-1' is mounted and displayed.

How does this work if url changes to a route where it's expected an 'initial' act will be loaded in a child stage? Here is what should happen when the user clicks the forward browser
button, and the url is now '/blog' again. Logic flow:
1. Url change detected by rootStage eventListener.
2. url '/blog' is converted into name: 'blog'
3. rootStage.open({name: 'blog'});
4. blog act opens, Blog component mounts, blogStage starts, blogStage.current === blogStage.initial === 'home'
5. There are no remaining segments in `name` for the blogStage to pass onto children, so the route stops here.

Problem: if we construct a name_to_url() function, how does it convert initial acts to routes? Simple:
We don't have to worry about that because initial pages don't need to be included in any name anyway, they are initial, they appear first.

so if you wanted to go to '/blog/home', you woulnd't, you would just go to url: '/blog', and the name: 'blog', would navigate to Blog and the initial page would automatically appear.

*/

