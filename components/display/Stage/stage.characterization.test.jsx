// Characterization tests for Stage, derived from how it is ACTUALLY used in production:
// kwbuilds.ca, maccobylab.com, torrin.me and OpenGig.org.
//
// These exist to be a safety net BEFORE Stage.jsx's URL routing is modified. They are written
// to pin CURRENT behaviour, including behaviour that is arguably wrong. A test here going red
// after a change to Stage.jsx means the change altered something four production sites depend
// on, whether or not that behaviour is correct.
//
// Two things separate these from stage.test.jsx:
//
//   1. Everything runs with isNode = false. Six of stage.test.jsx's eight tests run in node
//      mode, which takes the early return at the top of the Stage component and never executes
//      the URL routing code at all.
//
//   2. Assertions are on the SEQUENCE of history calls, not the final URL. Every interesting
//      bug in this component is a transient bad write that self-corrects, and a test that only
//      reads location.pathname at the end passes straight through all of them.
//
// Tests whose name starts with KNOWN- pin behaviour that is broken today. Do not "fix" them
// without deciding, deliberately, to change what those four sites see.

import { mount } from 'destam-dom';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

let isNode = true;

vi.mock('../../../ssg/is_node.js', () => ({
	default: () => isNode,
}));

const { Stage, StageContext, stageRegistry } = await import('./Stage.jsx');

const flushMicrotasks = async (count = 2) => {
	for (let i = 0; i < count; i += 1) {
		await new Promise(resolve => queueMicrotask(resolve));
	}
};

// commitUrl is scheduled with setTimeout(..., 0) since 009e82d, so a microtask flush is NOT
// enough to observe a URL write. This is what stage.test.jsx's history test is missing.
const flushTimers = async (count = 2) => {
	for (let i = 0; i < count; i += 1) {
		await new Promise(resolve => setTimeout(resolve, 0));
	}
};

const waitForAnimationFrames = async (count = 2) => {
	for (let i = 0; i < count; i += 1) {
		await new Promise(resolve => requestAnimationFrame(resolve));
	}
};

// Let a whole chained open settle. All three waits are load-bearing:
//   - microtasks: the deferred child open()
//   - animation frames: syncStage holds isPopState across two rAFs, and every syncUrl is a
//     no-op until it clears. Miss this and the history log is silently empty.
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
	vi.spyOn(history, 'pushState').mockImplementation((s, t, u) => {
		history_.push(`push ${u}`);
	});
	vi.spyOn(history, 'replaceState').mockImplementation((s, t, u) => {
		history_.push(`replace ${u}`);
	});
	return history_;
};

beforeEach(() => {
	isNode = false;
	window.history.replaceState({}, '', '/');
});

afterEach(() => {
	vi.restoreAllMocks();
	isNode = true;
	window.history.replaceState({}, '', '/');
	// register defaults to true, and one test below relies on that. Keep the module-level
	// registry from leaking between tests.
	stageRegistry.splice(0, stageRegistry.length);
});

// The config every surveyed root shares, give or take its acts map.
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

describe('Stage characterization: production root config', () => {
	// T1. The exact shape of all four surveyed roots, including register defaulting to true.
	// stage.test.jsx never sets truncateInitial and always passes register: false.
	it('T1 renders initial act, writes no history, and registers itself', async () => {
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
		// truncateInitial means the initial act is URL-implicit: '/' already matches, so
		// nothing should be written at all.
		expect(log).toEqual([]);
		expect(stageRegistry.includes(root)).toBe(true);
	});

	// T2. kwbuilds/maccobylab shape: the child StageContext lives INSIDE an act, so it does not
	// exist until the parent act mounts. Both nested tests in stage.test.jsx mount the child as
	// a static sibling of <Stage />, which never reproduces this.
	it('T2 restores a deep link whose child stage is mounted inside an act', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/s/velocity');
		const log = startHistoryLog();

		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });

		// This is the act. It provides its own StageContext, exactly like Startup.jsx.
		const StartupAct = () => <StageContext value={{
			acts: { profile: () => <div>Profile</div>, directory: () => <div>Directory</div> },
			initial: 'directory',
			fallback: 'profile',
			template: ({ children }) => children,
			register: false,
		}}>
			<ChildCapture />
		</StageContext>;

		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			startups: () => <div>Startups</div>,
			s: StartupAct,
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

	// T3. THE kwbuilds question.
	//
	// kwbuilds pairs stage.parent.open() with a manual history.replaceState in six places
	// (Startup.jsx:385,460,639, Newsletter.jsx:134,178, Unsubscribe.jsx:108). Either the router
	// emits a bad intermediate entry like /startups/velocity and those calls are load-bearing,
	// or it does not and they are vestigial. This settles it.
	it('T3 switching the parent act away from a routed child writes no stale deep path', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/s/velocity');

		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });

		const StartupAct = () => <StageContext value={{
			acts: { profile: () => <div>Profile</div>, directory: () => <div>Directory</div> },
			initial: 'directory',
			fallback: 'profile',
			template: ({ children }) => children,
			register: false,
		}}>
			<ChildCapture />
		</StageContext>;

		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			startups: () => <div>Startups</div>,
			s: StartupAct,
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Capture />
		</StageContext>);

		await settle();
		expect(child.current).toBe('velocity');

		// Only start logging now: we care about what this ONE navigation emits.
		const log = startHistoryLog();
		root.open({ name: 'startups' });
		await settle();

		expect(root.current).toBe('startups');
		// The claim under test: no entry may mention the old child's segment.
		expect(log.filter(e => e.includes('velocity'))).toEqual([]);
		expect(log).toEqual(['push /startups']);
	});

	// T4. The dashboard bug, in library terms: a routed Stage torn down by a conditional
	// wrapper (an auth gate) must not rewrite the URL on its way out.
	it('T4 unmounting a routed Stage leaves the URL alone', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/s/velocity');

		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });

		const StartupAct = () => <StageContext value={{
			acts: { profile: () => <div>Profile</div>, directory: () => <div>Directory</div> },
			initial: 'directory',
			fallback: 'profile',
			template: ({ children }) => children,
			register: false,
		}}>
			<ChildCapture />
		</StageContext>;

		// The auth gate: exactly the shape of dashboard's App.jsx, and of any loading state or
		// error boundary that conditionally renders a routed Stage.
		const { Observer } = await import('destam');
		const gate = Observer.mutable(true);

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			startups: () => <div>Startups</div>,
			s: StartupAct,
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			{gate.map(open => open ? <Stage /> : null)}
		</StageContext>);

		await settle();
		expect(child.current).toBe('velocity');

		const log = startHistoryLog();
		gate.set(false);          // the socket dropped; the gate closes
		await settle();

		expect(log).toEqual([]);
	});

	// T5. During an act switch the outgoing child and the incoming child can both be present in
	// parent.children. buildPathFromStage reads children[0], so which one wins is observable.
	it('T5 switching between two acts that each own a child stage', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/s/velocity');

		const makeAct = (name, acts, initial) => () => <StageContext value={{
			acts, initial, template: ({ children }) => children, register: false,
		}}>
			<Stage />
		</StageContext>;

		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			s: makeAct('s', { profile: () => <div>Profile</div> }, 'profile'),
			newsletter: makeAct('newsletter', { index: () => <div>Index</div> }, 'index'),
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Capture />
		</StageContext>);

		await settle();

		const log = startHistoryLog();
		root.open({ name: ['newsletter', 'index'] });
		await settle();

		expect(root.current).toBe('newsletter');
		expect(log.filter(e => e.includes('velocity'))).toEqual([]);
		expect(log).toEqual(['push /newsletter/index']);
	});

	// T6. A multi-segment open from a click, which is how every tile and card navigates.
	// 009e82d exists because this used to emit a phantom parent-only entry first.
	it('T6 a chained two-segment open writes exactly one history entry', async () => {
		const elem = document.createElement('body');

		const StartupAct = () => <StageContext value={{
			acts: { profile: () => <div>Profile</div>, directory: () => <div>Directory</div> },
			initial: 'directory',
			fallback: 'profile',
			template: ({ children }) => children,
			register: false,
		}}>
			<Stage />
		</StageContext>;

		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			s: StartupAct,
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
});

describe('Stage characterization: behaviour that is broken today', () => {
	// T7. kwbuilds Admin.jsx:57-64 documents this in a code comment and works around it by
	// seeding `initial` from window.location. maccobylab restructured Experiment.jsx to dodge
	// it. Two independent workarounds for one bug, so pin it.
	it('KNOWN-T7 a child stage that mounts late loses the route tail', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/admin/news');

		const { Observer } = await import('destam');
		const ready = Observer.mutable(false);   // stands in for an async auth check

		let child = null;
		const ChildCapture = StageContext.use(s => () => { child = s; return <Stage />; });

		const AdminAct = () => ready.map(r => !r ? <div>Loading</div> : <StageContext value={{
			acts: { pipeline: () => <div>Pipeline</div>, news: () => <div>News</div> },
			initial: 'pipeline',
			template: ({ children }) => children,
			register: false,
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
		ready.set(true);          // auth resolves; the child stage mounts now, too late
		await settle();

		// Pinning the BUG: the 'news' tail was dropped and the child fell back to its initial.
		expect(child).not.toBe(null);
		expect(child.current).toBe('pipeline');
	});

	// T8. kwbuilds Startup.jsx and Newsletter.jsx route every real page this way: the slug is
	// never a key in acts, so the fallback IS the happy path and console.error fires on every
	// successful page load.
	it('KNOWN-T8 an unknown segment renders fallbackAct and logs an error', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/s/velocity');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

		const StartupAct = () => <StageContext value={{
			acts: { profile: () => <div>Profile</div>, directory: () => <div>Directory</div> },
			initial: 'directory',
			fallback: 'profile',
			template: ({ children }) => children,
			register: false,
		}}>
			<Stage />
		</StageContext>;

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			s: StartupAct,
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Stage />
		</StageContext>);

		await settle();

		expect(findText(elem.tree(), 'Profile')).toBe(true);
		// The error path is the happy path. Pinning it so nobody "fixes" the noise by changing
		// fallback resolution.
		expect(errorSpy).toHaveBeenCalled();
	});

	// T9. OpenGig ForContractors.jsx:38,189 calls open() with names that exist in no acts map.
	// The router still writes them to the address bar.
	it('KNOWN-T9 open() on an unknown act still writes that name to the URL', async () => {
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
		root.open({ name: 'waitlist' });     // not an act
		await settle();

		expect(root.current).toBe('waitlist');
		expect(log).toEqual(['push /waitlist']);
		expect(errorSpy).toHaveBeenCalled();
	});

	// T10. torrin.me Playground.jsx registers an act literally named '@destamatic/ui' and then
	// opens it by that string. open() splits on '/', so the route is broken by construction.
	it('KNOWN-T10 an act name containing a slash is split into segments', async () => {
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
			initial: 'other',
			fallback: 'fallback',
			template: Template,
			register: false,
		}}>
			<Capture />
		</StageContext>);

		await flushMicrotasks();
		root.open({ name: '@destamatic/ui' });
		await settle();

		// Pinning the BUG: it opened '@destamatic', not '@destamatic/ui', so the act is
		// unreachable by its own name and the fallback renders instead.
		expect(root.current).toBe('@destamatic');
		expect(findText(elem.tree(), 'Lib')).toBe(false);
		expect(errorSpy).toHaveBeenCalled();
	});

	// T11. kwbuilds Newsletter.jsx:229 ships this combination, so the warning fires in
	// production on every /newsletter visit.
	it('KNOWN-T11 child truncateInitial under a routed root warns', async () => {
		const elem = document.createElement('body');
		const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => { });

		const NewsletterAct = () => <StageContext value={{
			acts: { index: () => <div>Index</div>, issue: () => <div>Issue</div> },
			initial: 'index',
			truncateInitial: true,
			fallback: 'issue',
			template: ({ children }) => children,
			register: false,
		}}>
			<Stage />
		</StageContext>;

		let root = null;
		const Capture = StageContext.use(s => () => { root = s; return <Stage />; });

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			newsletter: NewsletterAct,
			fallback: () => <div>NotFound</div>,
		}, { register: false })}>
			<Capture />
		</StageContext>);

		await settle();
		root.open({ name: 'newsletter' });
		await settle();

		expect(warnSpy).toHaveBeenCalled();
	});

	// T12. kwbuilds Admin's child stage declares no fallback, so an unknown segment there has
	// to resolve against the ROOT's fallback by walking up the parent chain.
	it('T12 fallbackAct resolves by walking up to a parent stage', async () => {
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/admin/nope');
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => { });

		const AdminAct = () => <StageContext value={{
			acts: { pipeline: () => <div>Pipeline</div> },
			initial: 'pipeline',
			template: ({ children }) => children,
			register: false,
		}}>
			<Stage />
		</StageContext>;

		mount(elem, <StageContext value={productionRoot({
			landing: () => <div>Landing</div>,
			admin: AdminAct,
			fallback: () => <div>RootNotFound</div>,
		}, { register: false })}>
			<Stage />
		</StageContext>);

		await settle();

		// The child has no fallback of its own, so the root's must be used.
		expect(findText(elem.tree(), 'RootNotFound')).toBe(true);
		expect(errorSpy).toHaveBeenCalled();
	});
});
