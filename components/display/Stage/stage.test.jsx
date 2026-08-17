// Stage: rendering, nesting, and the address bar.
//
// ONE SUITE, ON PURPOSE. This replaces a pair of files that had drifted apart: a unit suite
// written in February that went red in April and May when Stage changed underneath it, and a
// characterization suite written later that pinned the CURRENT behaviour instead, five of its
// cases prefixed KNOWN- to mark bugs it was recording rather than testing. That arrangement
// answered "what does Stage do today" but left nothing that answered "what should it do", and a
// permanently red suite is one nobody can use as a gate.
//
// So every test here asserts intended behaviour. There are no pinned bugs and no
// known-broken exceptions; if one of these fails, something is wrong.
//
// The route shapes are taken from the apps that actually use this, because Stage's hard parts
// only appear in their combinations: a child stage living INSIDE an act rather than beside one
// (kwbuilds Startup.jsx, maccobylab Experiment.jsx), a child that mounts behind an async gate
// (kwbuilds Admin.jsx), and a segment that is DATA rather than an act name (/s/<slug>,
// /app/<uuid>, /newsletter/<issue>).

import { mount } from 'destam-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let isNode = true;

vi.mock('../../../ssg/is_node.js', () => ({
	default: () => isNode,
}));

const { Stage, StageContext, stageRegistry } = await import('./Stage.jsx');

const flushMicrotasks = async (count = 3) => {
	for (let i = 0; i < count; i += 1) {
		await new Promise(resolve => queueMicrotask(resolve));
	}
};

const waitForAnimationFrames = async (count = 2) => {
	for (let i = 0; i < count; i += 1) {
		await new Promise(resolve => requestAnimationFrame(resolve));
	}
};

const flushTimers = async (count = 2) => {
	for (let i = 0; i < count; i += 1) {
		await new Promise(resolve => setTimeout(resolve, 0));
	}
};

// Let a whole chained open settle. All three waits are load-bearing, and missing any one of them
// is how the old suite ended up asserting against an empty history log:
//   - microtasks: the deferred child open(), and a late child picking up a parked tail
//   - animation frames: syncStage holds isPopState across two rAFs and every syncUrl is a no-op
//     until it clears
//   - timers: commitUrl runs on setTimeout(..., 0)
const settle = async () => {
	await flushMicrotasks(3);
	await waitForAnimationFrames(2);
	await flushTimers(2);
};

const Template = ({ children }) => <div>{children}</div>;

const findText = (node, text) => {
	if (node == null) return false;
	if (typeof node === 'string') return node.includes(text);
	if (typeof node !== 'object') return false;
	const children = Array.isArray(node.children) ? node.children : [];
	return children.some(child => findText(child, text));
};

// Records the ordered sequence of history writes as ['push /a/b', 'replace /a'].
// The order and the intermediate entries are the whole point; a final-URL assertion hides them.
let history_;
const startHistoryLog = () => {
	history_ = [];
	vi.spyOn(history, 'pushState').mockImplementation((s, t, u) => { history_.push(`push ${u}`); });
	vi.spyOn(history, 'replaceState').mockImplementation((s, t, u) => { history_.push(`replace ${u}`); });
	return history_;
};

// The config the real roots share, give or take their acts map.
const productionRoot = (acts, extra = {}) => ({
	acts,
	onOpen: () => { },
	template: ({ children }) => children,
	initial: 'landing',
	urlRouting: true,
	fallback: 'fallback',
	truncateInitial: true,
	ssg: true,
	...extra,
});

// A child stage that lives inside its act, which is the shape every app uses.
const actWithChildStage = (config, capture) => () => <StageContext value={{
	template: ({ children }) => children,
	register: false,
	...config,
}}>
	{capture ? capture() : <Stage />}
</StageContext>;

// The browser path is the default, because that is where every routing behaviour lives. The two
// prerender cases opt into `isNode = true` themselves. Getting this backwards is silent: the SSR
// branch of Stage never installs URL routing, so every history assertion quietly sees nothing.
beforeEach(() => {
	isNode = false;
	window.history.replaceState({}, '', '/');
});

afterEach(() => {
	vi.restoreAllMocks();
	isNode = true;
	window.history.replaceState({}, '', '/');
	// register defaults to true and one test relies on that, so keep the module-level registry
	// from leaking between cases.
	stageRegistry.splice(0, stageRegistry.length);
});

describe('Stage: rendering and open()', () => {
	it('renders the initial act', () => {
		const elem = document.createElement('body');

		mount(elem, <StageContext value={{
			acts: { first: () => <div>First</div>, second: () => <div>Second</div> },
			initial: 'first', template: Template, register: false,
		}}>
			<Stage />
		</StageContext>);

		expect(findText(elem.tree(), 'First')).toBe(true);
	});

	it('switches acts via open()', async () => {
		const elem = document.createElement('body');
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={{
			acts: { first: () => <div>First</div>, second: () => <div>Second</div> },
			initial: 'first', template: Template, register: false,
		}}>
			<Capture />
		</StageContext>);

		root.open({ name: 'second' });
		await flushMicrotasks();

		expect(findText(elem.tree(), 'Second')).toBe(true);
	});

	it('lets onOpen redirect the name and the props', async () => {
		const elem = document.createElement('body');
		const onOpen = vi.fn(() => ({ name: ['alt'], props: { label: 'FromOnOpen' } }));
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={{
			acts: { alt: ({ label }) => <div>{label}</div> },
			onOpen, template: Template, register: false,
		}}>
			<Capture />
		</StageContext>);

		root.open({ name: 'first' });
		await flushMicrotasks();

		expect(onOpen).toHaveBeenCalled();
		expect(findText(elem.tree(), 'FromOnOpen')).toBe(true);
	});

	it('passes urlProps to the leaf act', async () => {
		const elem = document.createElement('body');
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={{
			acts: { props: ({ query }) => <div>{query}</div> },
			template: Template, register: false,
		}}>
			<Capture />
		</StageContext>);

		root.open({ name: 'props', urlProps: { query: 'hello' } });
		await flushMicrotasks();

		expect(findText(elem.tree(), 'hello')).toBe(true);
	});

	// `open('a/b')` is the documented way to reach a nested route, so '/' has to split. An act
	// that is NAMED with a slash in it must still be reachable by its own name, which it was not:
	// the string was split unconditionally, so the act could never be opened at all.
	it('opens an act whose own name contains a slash', async () => {
		const elem = document.createElement('body');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={{
			acts: {
				'@destamatic/ui': () => <div>Lib</div>,
				other: () => <div>Other</div>,
				fallback: () => <div>NotFound</div>,
			},
			initial: 'other', fallback: 'fallback', template: Template, register: false,
		}}>
			<Capture />
		</StageContext>);

		await flushMicrotasks();
		root.open({ name: '@destamatic/ui' });
		await settle();

		expect(root.current).toBe('@destamatic/ui');
		expect(findText(elem.tree(), 'Lib')).toBe(true);
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('still splits a slash-separated route that is not an act name', async () => {
		const elem = document.createElement('body');
		let root = null;
		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={{
			acts: {
				parent: actWithChildStage({
					acts: { child: () => <div>Child</div>, other: () => <div>Other</div> },
					initial: 'other',
				}, () => <ChildCapture />),
			},
			template: Template, register: false,
		}}>
			<Capture />
		</StageContext>);

		root.open({ name: 'parent/child' });
		await settle();

		expect(root.current).toBe('parent');
		expect(child.current).toBe('child');
	});
});

describe('Stage: parameterised segments', () => {
	// The single most common real route: the segment is DATA, not an act name, and `fallback` is
	// what renders it. kwbuilds routes every startup and newsletter page this way, the dashboard
	// routes /app/<uuid> this way. It is the happy path, so it must be silent.
	it('renders the fallback for a segment that is not an act, without logging', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/s/velocity');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			s: actWithChildStage({
				acts: { profile: () => <div>Profile</div>, directory: () => <div>Directory</div> },
				initial: 'directory', fallback: 'profile',
			}),
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Stage />
		</StageContext>);

		await settle();

		expect(findText(elem.tree(), 'Profile')).toBe(true);
		expect(errorSpy).not.toHaveBeenCalled();
	});

	// Opening a name that is not an act is the same mechanism seen from the other side: it is how
	// an app navigates TO a parameterised route. The name has to reach the address bar or the
	// route cannot be linked to or restored.
	it('writes a non-act name to the URL and renders the fallback for it', async () => {
		const elem = document.createElement('body');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Capture />
		</StageContext>);

		await settle();

		const log = startHistoryLog();
		root.open({ name: 'waitlist' });
		await settle();

		expect(root.current).toBe('waitlist');
		expect(log).toEqual(['push /waitlist']);
		expect(findText(elem.tree(), 'NotFound')).toBe(true);
		expect(errorSpy).not.toHaveBeenCalled();
	});

	// A child stage often declares no fallback of its own, so resolution walks up to the root's.
	it('resolves the fallback by walking up to a parent stage', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/admin/nope');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			admin: actWithChildStage({ acts: { pipeline: () => <div>Pipeline</div> }, initial: 'pipeline' }),
			fallback: () => <div>RootNotFound</div>,
		}, { register: false })}>
			<Stage />
		</StageContext>);

		await settle();

		expect(findText(elem.tree(), 'RootNotFound')).toBe(true);
		expect(errorSpy).not.toHaveBeenCalled();
	});

	// The one case that IS an error: nothing in the chain can render the segment, so the stage
	// shows nothing at all and the developer needs telling.
	it('logs an error when there is no usable fallback anywhere in the chain', async () => {
		const elem = document.createElement('body');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={{
			acts: { only: () => <div>Only</div> },
			initial: 'only', template: Template, register: false,
		}}>
			<Capture />
		</StageContext>);

		root.open({ name: 'nope' });
		await settle();

		expect(findText(elem.tree(), 'Only')).toBe(false);
		expect(errorSpy).toHaveBeenCalled();
	});

	// Prerendering has to agree with the browser. This path ignored `fallback` outright, so an
	// SSG'd parameterised route came out empty and only filled in once the client took over.
	it('renders the fallback when prerendering, not nothing', () => {
		isNode = true;
		const elem = document.createElement('body');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

		mount(elem, <StageContext value={{
			acts: { ok: () => <div>Fallback</div> },
			initial: 'missing', fallback: 'ok', template: Template, register: false,
		}}>
			<Stage />
		</StageContext>);

		expect(findText(elem.tree(), 'Fallback')).toBe(true);
		expect(errorSpy).not.toHaveBeenCalled();
	});

	it('logs when prerendering finds no fallback either', () => {
		isNode = true;
		const elem = document.createElement('body');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

		mount(elem, <StageContext value={{
			acts: { ok: () => <div>Something</div> },
			initial: 'missing', template: Template, register: false,
		}}>
			<Stage />
		</StageContext>);

		expect(findText(elem.tree(), 'Something')).toBe(false);
		expect(errorSpy).toHaveBeenCalled();
	});
});

describe('Stage: nesting and the address bar', () => {
	it('renders the initial act, writes no history, and registers itself', async () => {
		const elem = document.createElement('body');
		const log = startHistoryLog();
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			fallback: () => <div>NotFound</div>,
		})}>
			<Capture />
		</StageContext>);

		await settle();

		expect(root.current).toBe('landing');
		expect(findText(elem.tree(), 'Landing')).toBe(true);
		// truncateInitial makes the initial act URL-implicit: '/' already matches it, so nothing
		// should be written at all.
		expect(log).toEqual([]);
		expect(stageRegistry.includes(root)).toBe(true);
	});

	it('restores a deep link whose child stage is mounted inside an act', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/s/velocity');
		const log = startHistoryLog();

		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			startups: () => <div>Startups</div>,
			s: actWithChildStage({
				acts: { profile: () => <div>Profile</div>, directory: () => <div>Directory</div> },
				initial: 'directory', fallback: 'profile',
			}, () => <ChildCapture />),
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Capture />
		</StageContext>);

		await settle();

		expect(root.current).toBe('s');
		expect(child).not.toBe(null);
		expect(child.current).toBe('velocity');
		expect(log).toEqual([]);
	});

	// Switching the parent away from a routed child must not leave a stale deep path behind. Six
	// call sites in one app pair open() with a manual history.replaceState because of this; the
	// answer is that they do not need to.
	it('switching the parent act away from a routed child writes no stale deep path', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/s/velocity');

		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			startups: () => <div>Startups</div>,
			s: actWithChildStage({
				acts: { profile: () => <div>Profile</div>, directory: () => <div>Directory</div> },
				initial: 'directory', fallback: 'profile',
			}, () => <ChildCapture />),
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Capture />
		</StageContext>);

		await settle();
		expect(child.current).toBe('velocity');

		// Only log from here: what this ONE navigation emits is the question.
		const log = startHistoryLog();
		root.open({ name: 'startups' });
		await settle();

		expect(log).toEqual(['push /startups']);
	});

	it('writes exactly one history entry for a chained two-segment open', async () => {
		const elem = document.createElement('body');
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			s: actWithChildStage({
				acts: { profile: () => <div>Profile</div>, directory: () => <div>Directory</div> },
				initial: 'directory', fallback: 'profile',
			}),
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Capture />
		</StageContext>);

		await settle();

		const log = startHistoryLog();
		root.open({ name: ['s', 'velocity'] });
		await settle();

		expect(log).toEqual(['push /s/velocity']);
	});

	it('syncs URL segments and query into the stage chain', async () => {
		isNode = false;
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/parent/child?q=hello');

		let root = null;
		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });
		const RootCapture = StageContext.use(s => () => {
			root = s;
			return <div>
				<Stage />
				<StageContext value={{ acts: { child: () => <div>Child</div> }, template: Template, register: false }}>
					<ChildCapture />
				</StageContext>
			</div>;
		});

		mount(elem, <StageContext value={{
			acts: { parent: () => <div>Parent</div> },
			template: Template, urlRouting: true, register: false,
		}}>
			<RootCapture />
		</StageContext>);

		await settle();

		expect(root.current).toBe('parent');
		expect(child.current).toBe('child');
		// urlProps belong to the LEAF only, so an intermediate stage must not carry them.
		expect(root.urlProps).toEqual({});
		expect(child.urlProps).toEqual({ q: 'hello' });
	});

	// A routed root clears its descendants when the route ends higher up, so a stale query cannot
	// leak back into the address bar on the next write.
	it('clears descendant urlProps when a routed parent becomes the leaf', async () => {
		isNode = false;
		const elem = document.createElement('body');

		let root = null;
		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });
		const RootCapture = StageContext.use(s => () => {
			root = s;
			return <div>
				<Stage />
				<StageContext value={{
					acts: { child: () => <div>Child</div>, childDefault: () => <div>Default</div> },
					initial: 'childDefault', template: Template, register: false,
				}}>
					<ChildCapture />
				</StageContext>
			</div>;
		});

		mount(elem, <StageContext value={{
			acts: { parent: () => <div>Parent</div> },
			template: Template, urlRouting: true, register: false,
		}}>
			<RootCapture />
		</StageContext>);

		root.open({ name: 'parent/child', urlProps: { q: '1' } });
		await settle();

		expect(root.current).toBe('parent');
		expect(child.current).toBe('child');
		expect(root.urlProps).toEqual({});
		expect(child.urlProps).toEqual({ q: '1' });

		root.open({ name: 'parent' });
		await settle();

		expect(child.urlProps).toEqual({});
		expect(child.current).toBe('childDefault');
	});

	// Without urlRouting there is no address bar to leak into, so the clearing is deliberately
	// skipped. Asserting it keeps someone from "restoring" a behaviour that was removed on
	// purpose.
	it('leaves descendant urlProps alone when the root is not routing', async () => {
		isNode = false;
		const elem = document.createElement('body');

		let root = null;
		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });
		const RootCapture = StageContext.use(s => () => {
			root = s;
			return <div>
				<Stage />
				<StageContext value={{
					acts: { child: () => <div>Child</div>, childDefault: () => <div>Default</div> },
					initial: 'childDefault', template: Template, register: false,
				}}>
					<ChildCapture />
				</StageContext>
			</div>;
		});

		mount(elem, <StageContext value={{
			acts: { parent: () => <div>Parent</div> },
			template: Template, register: false,
		}}>
			<RootCapture />
		</StageContext>);

		root.open({ name: 'parent/child', urlProps: { q: '1' } });
		await settle();
		expect(child.urlProps).toEqual({ q: '1' });

		root.open({ name: 'parent' });
		await settle();

		expect(child.urlProps).toEqual({ q: '1' });
	});

	it('pushes for a path change and replaces for a query-only change', async () => {
		isNode = false;
		const elem = document.createElement('body');
		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={{
			acts: { home: () => <div>Home</div>, profile: () => <div>Profile</div> },
			initial: 'home', template: Template, urlRouting: true, register: false,
		}}>
			<Capture />
		</StageContext>);

		await settle();

		// Log only from here, so the initial mount's own write is not counted.
		const log = startHistoryLog();

		root.open({ name: 'profile' });
		await settle();
		expect(log).toEqual(['push /profile']);

		root.open({ name: 'profile', urlProps: { page: '2' } });
		await settle();
		expect(log).toEqual(['push /profile', 'replace /profile?page=2']);
	});

	it('unmounting a routed Stage leaves the URL alone', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/s/velocity');

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			s: actWithChildStage({
				acts: { profile: () => <div>Profile</div> }, initial: 'profile', fallback: 'profile',
			}),
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Stage />
		</StageContext>);

		await settle();

		const log = startHistoryLog();
		mount(elem, null);
		await settle();

		expect(log).toEqual([]);
	});
});

describe('Stage: a child stage that mounts late', () => {
	// The shape that had two independent workarounds in production. The child stage lives inside
	// an act that renders behind an async gate, so it does not exist when the route arrives; the
	// tail has to wait for it rather than being dropped.
	it('applies the route tail to a child stage that appears after the route did', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/admin/news');

		const { Observer } = await import('destam');
		const ready = Observer.mutable(false);   // stands in for an async auth check

		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });

		const AdminAct = () => ready.map(r => !r ? <div>Loading</div> : <StageContext value={{
			acts: { pipeline: () => <div>Pipeline</div>, news: () => <div>News</div> },
			initial: 'pipeline', template: ({ children }) => children, register: false,
		}}>
			<ChildCapture />
		</StageContext>);

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			admin: AdminAct,
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Stage />
		</StageContext>);

		await settle();
		ready.set(true);          // auth resolves; the child stage mounts now
		await settle();

		expect(child).not.toBe(null);
		expect(child.current).toBe('news');
		expect(findText(elem.tree(), 'News')).toBe(true);
	});

	// A parked tail belongs to the route that produced it. If the user navigates on before the
	// child appears, it must not be replayed onto a screen they already left.
	it('drops a parked tail when the parent navigates before the child appears', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/admin/news');

		const { Observer } = await import('destam');
		const ready = Observer.mutable(false);

		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });

		const AdminAct = () => ready.map(r => !r ? <div>Loading</div> : <StageContext value={{
			acts: { pipeline: () => <div>Pipeline</div>, news: () => <div>News</div> },
			initial: 'pipeline', template: ({ children }) => children, register: false,
		}}>
			<ChildCapture />
		</StageContext>);

		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			admin: AdminAct,
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Capture />
		</StageContext>);

		await settle();

		// Navigate away while the gate is still closed, THEN let it open.
		root.open({ name: 'admin' });
		await settle();
		ready.set(true);
		await settle();

		expect(child).not.toBe(null);
		expect(child.current).toBe('pipeline');
	});
});

describe('Stage: the truncateInitial warning', () => {
	// truncateInitial is the right setting for a parameterised route (/app/<uuid>, not
	// /app/<uuid>/home), so using it must not warn. It only hides state when a FURTHER stage
	// nests inside the truncated act, which is the only case worth saying anything about.
	it('does not warn for a stage nested under an act that contributes a segment', async () => {
		const elem = document.createElement('body');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			newsletter: actWithChildStage({
				acts: { index: () => <div>Index</div>, issue: () => <div>Issue</div> },
				initial: 'index', truncateInitial: true, fallback: 'issue',
			}),
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Capture />
		</StageContext>);

		await settle();
		root.open({ name: 'newsletter' });
		await settle();

		expect(warnSpy).not.toHaveBeenCalled();
	});

	// Nesting under a truncated act is not itself a problem: while the child sits on its own
	// initial act there is nothing to represent, so nothing is lost.
	it('does not warn while the nested stage is on its own initial act', async () => {
		const elem = document.createElement('body');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

		mount(elem, <StageContext value={productionRoot({
			landing: actWithChildStage({
				acts: { a: () => <div>A</div>, b: () => <div>B</div> }, initial: 'a',
			}),
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Stage />
		</StageContext>);

		await settle();

		expect(warnSpy).not.toHaveBeenCalled();
	});

	// The one arrangement that genuinely loses state on refresh: the parent truncates, is on the
	// act it truncates, and the child has moved off its own initial. There is no segment to hang
	// 'b' off, so a reload comes back on 'a'.
	it('warns when nested state moves off its initial with no segment to hold it', async () => {
		const elem = document.createElement('body');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: actWithChildStage({
				acts: { a: () => <div>A</div>, b: () => <div>B</div> }, initial: 'a',
			}, () => <ChildCapture />),
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Stage />
		</StageContext>);

		await settle();
		expect(warnSpy).not.toHaveBeenCalled();

		child.open({ name: 'b' });
		await settle();

		expect(warnSpy).toHaveBeenCalled();
	});
});
