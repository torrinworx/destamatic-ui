// Stage routing scratchpad: the route shapes real apps use, in a real browser.
//
//   npm run dev   ->   http://localhost:5173/routing.html
//
// The unit suite runs Stage against jsdom with a mocked is_node and hand-flushed microtasks,
// animation frames and timers. That is precise but it is not a browser: it cannot show you the
// address bar, it fakes the history API, and every one of its waits is a guess about scheduling
// that a real engine may not share. This page is the other half. Everything here is a shape
// lifted from an app that ships:
//
//   /s/<slug>              a segment that is DATA, not an act name. kwbuilds routes every
//                          startup and newsletter page this way; the fallback act renders it.
//   /admin/<tail>          a child stage behind an async gate, so it does not exist when the
//                          route arrives. kwbuilds Admin.jsx worked around this by seeding
//                          `initial` from window.location; maccobylab restructured a component.
//   /app/<uuid>/settings   two levels under a parameterised segment. This is the dashboard's
//                          module runtime, where the uuid is data and the tail is real acts.
//   /@destamatic/ui        an act whose own NAME contains a slash. torrin.me's playground
//                          registers one and opens it by that string.
//
// `window.__probe` is the machine-readable half, so a browser driver can assert on counts
// instead of scraping text. Console errors and warnings are counted rather than silenced: on
// every route below the expected count is ZERO, which is the whole point of the fallback work.

import { mount, Stage, StageContext, Observer, OObject, Theme, Typography } from '@destamatic/ui';

const theme = OObject({
	primary: OObject({
		$color: '#02CA9F',
		$color_top: 'black',
	}),
});

// Counted, not muted. A route that renders correctly must also be quiet, and before this work a
// correct /s/<slug> load printed an error every time.
const probe = { errors: [], warns: [] };
window.__probe = probe;
for (const [level, sink] of [['error', probe.errors], ['warn', probe.warns]]) {
	const original = console[level].bind(console);
	console[level] = (...args) => {
		sink.push(args.map(a => typeof a === 'string' ? a : '[obj]').join(' ').slice(0, 200));
		original(...args);
	};
}

const Line = ({ label, value }) => <div style={{ padding: '2px 0' }}>
	<span style={{ opacity: 0.6 }}>{label}: </span>
	<span>{value}</span>
</div>;

// --- /s/<slug> ------------------------------------------------------------------------------
// The slug is never a key in acts, so `fallback` IS the happy path.
const StartupProfile = StageContext.use(s => () => <div id="startup">
	<Line label="startup" value={s.current} />
</div>);

const StartupsAct = () => <StageContext value={{
	acts: { directory: () => <div id="startup">directory</div>, profile: StartupProfile },
	initial: 'directory',
	fallback: 'profile',
	template: ({ children }) => children,
	register: false,
}}>
	<Stage />
</StageContext>;

// --- /admin/<tail>, behind an async gate ----------------------------------------------------
// The child stage does not exist when the route arrives. It appears when `ready` flips, and the
// tail has to have been kept for it.
const ready = Observer.mutable(false);
window.__openGate = () => ready.set(true);

const AdminAct = () => ready.map(r => !r
	? <div id="admin">loading</div>
	: <StageContext value={{
		acts: {
			pipeline: () => <div id="admin">pipeline</div>,
			news: () => <div id="admin">news</div>,
		},
		initial: 'pipeline',
		template: ({ children }) => children,
		register: false,
	}}>
		<Stage />
	</StageContext>);

// --- /app/<uuid>/<screen>/<sub> -------------------------------------------------------------
// The dashboard's shape: a parameterised uuid, then real acts under it, two levels deep.
const ModuleScreens = StageContext.use(s => () => <StageContext value={{
	acts: {
		profile: () => <div id="sub">profile</div>,
		general: () => <div id="sub">general</div>,
	},
	initial: 'general',
	template: ({ children }) => children,
	register: false,
}}>
	<div id="screen">{s.current}</div>
	<Stage />
</StageContext>);

const ModuleAct = () => <StageContext value={{
	acts: { home: () => <div id="screen">home</div>, settings: ModuleScreens },
	initial: 'home',
	fallback: 'home',
	template: ({ children }) => children,
	truncateInitial: true,
	register: false,
}}>
	<Stage />
</StageContext>;

const AppAct = () => <StageContext value={{
	acts: { view: ModuleAct },
	initial: 'view',
	fallback: 'view',
	template: ({ children }) => children,
	truncateInitial: true,
	register: false,
}}>
	<Stage />
</StageContext>;

// --- the root ------------------------------------------------------------------------------
const Root = StageContext.use(s => () => {
	window.__stage = s;
	return <div style={{ padding: 16 }}>
		<Typography type="h6" label="Stage routing scratchpad" />
		<Line label="path" value={Observer.timer(200).map(() => location.pathname)} />
		<Line label="root act" value={s.observer.path('current')} />
		<div id="outlet" style={{ marginTop: 12, padding: 12, border: '1px solid #ccc' }}>
			<Stage />
		</div>
		<div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
			{[
				['/', 'landing'],
				['/s/velocity', 'startup slug'],
				['/admin/news', 'gated child'],
				['/app/ABC123/settings/profile', 'two levels'],
				['/@destamatic/ui', 'slash act'],
				['/nope', 'unknown'],
			].map(([href, label]) => <button id={`go${href}`} onClick={() => {
				history.pushState({}, '', href);
				dispatchEvent(new PopStateEvent('popstate'));
			}}>{label}</button>)}
		</div>
	</div>;
});

mount(document.getElementById('app'), <Theme value={theme}>
	<StageContext value={{
		acts: {
			landing: () => <div id="landing">landing</div>,
			s: StartupsAct,
			admin: AdminAct,
			app: AppAct,
			'@destamatic/ui': () => <div id="lib">lib</div>,
			notfound: () => <div id="notfound">not found</div>,
		},
		initial: 'landing',
		fallback: 'notfound',
		urlRouting: true,
		truncateInitial: true,
		template: ({ children }) => children,
	}}>
		<Root />
	</StageContext>
</Theme>);
