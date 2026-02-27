import { mount } from 'destam-dom';
import { describe, it, expect, vi, afterEach } from 'vitest';

let isNode = true;

vi.mock('../../../ssg/is_node.js', () => ({
	default: () => isNode,
}));

const { Stage, StageContext } = await import('./Stage.jsx');

const flushMicrotasks = async (count = 1) => {
	for (let i = 0; i < count; i += 1) {
		await new Promise(resolve => queueMicrotask(resolve));
	}
};

const waitForAnimationFrames = async (count = 2) => {
	for (let i = 0; i < count; i += 1) {
		await new Promise(resolve => requestAnimationFrame(resolve));
	}
};

const findText = (node, text) => {
	if (node == null) return false;
	if (typeof node === 'string') return node.includes(text);
	if (typeof node !== 'object') return false;

	const children = Array.isArray(node.children) ? node.children : [];
	return children.some(child => findText(child, text));
};

const Template = ({ children }) => <div>{children}</div>;

afterEach(() => {
	vi.restoreAllMocks();
	isNode = true;
	window.history.replaceState({}, '', '/');
});

describe('Stage', () => {
	it('Should render the initial act', () => {
		const elem = document.createElement('body');
		const acts = {
			first: () => <div>First</div>,
			second: () => <div>Second</div>,
		};

		mount(elem, (
			<StageContext value={{ acts, initial: 'first', template: Template, register: false }}>
				<Stage />
			</StageContext>
		));

		const tree = elem.tree();
		expect(findText(tree, 'First')).toBe(true);
	});

	it('Should switch acts via open()', async () => {
		const elem = document.createElement('body');
		const acts = {
			first: () => <div>First</div>,
			second: () => <div>Second</div>,
		};
		let stageRef = null;

		const Capture = StageContext.use(s => () => {
			stageRef = s;
			return <Stage />;
		});

		mount(elem, (
			<StageContext value={{ acts, initial: 'first', template: Template, register: false }}>
				<Capture />
			</StageContext>
		));

		stageRef.open({ name: 'second' });
		await flushMicrotasks();

		const tree = elem.tree();
		expect(findText(tree, 'Second')).toBe(true);
	});

	it('Should allow onOpen to redirect name and props', async () => {
		const elem = document.createElement('body');
		const onOpen = vi.fn(() => ({
			name: ['alt'],
			props: { label: 'FromOnOpen' },
		}));
		const acts = {
			alt: ({ label }) => <div>{label}</div>,
		};
		let stageRef = null;

		const Capture = StageContext.use(s => () => {
			stageRef = s;
			return <Stage />;
		});

		mount(elem, (
			<StageContext value={{ acts, onOpen, template: Template, register: false }}>
				<Capture />
			</StageContext>
		));

		stageRef.open({ name: 'first' });
		await flushMicrotasks();

		const tree = elem.tree();
		expect(onOpen).toHaveBeenCalled();
		expect(findText(tree, 'FromOnOpen')).toBe(true);
	});

	it('Should pass urlProps to the leaf act', async () => {
		const elem = document.createElement('body');
		const acts = {
			props: ({ query }) => <div>{query}</div>,
		};
		let stageRef = null;

		const Capture = StageContext.use(s => () => {
			stageRef = s;
			return <Stage />;
		});

		mount(elem, (
			<StageContext value={{ acts, template: Template, register: false }}>
				<Capture />
			</StageContext>
		));

		stageRef.open({ name: 'props', urlProps: { query: 'hello' } });
		await flushMicrotasks();

		const tree = elem.tree();
		expect(findText(tree, 'hello')).toBe(true);
	});

	it('Should route to child stages and keep urlProps on the leaf', async () => {
		const elem = document.createElement('body');
		const acts = {
			parent: () => <div>Parent</div>,
		};
		const childActs = {
			child: () => <div>Child</div>,
			childDefault: () => <div>ChildDefault</div>,
		};
		let rootStage = null;
		let childStage = null;

		const ChildCapture = StageContext.use(s => () => {
			childStage = s;
			return <Stage />;
		});

		const RootCapture = StageContext.use(s => () => {
			rootStage = s;
			return <div>
				<Stage />
				<StageContext value={{
					acts: childActs,
					initial: 'childDefault',
					template: Template,
					register: false,
				}}>
					<ChildCapture />
				</StageContext>
			</div>;
		});

		mount(elem, (
			<StageContext value={{ acts, template: Template, register: false }}>
				<RootCapture />
			</StageContext>
		));

		rootStage.open({ name: 'parent/child', urlProps: { q: '1' } });
		await flushMicrotasks(2);

		expect(rootStage.current).toBe('parent');
		expect(childStage.current).toBe('child');
		expect(rootStage.urlProps).toEqual({});
		expect(childStage.urlProps).toEqual({ q: '1' });

		rootStage.open({ name: 'parent' });
		await flushMicrotasks(2);

		expect(childStage.urlProps).toEqual({});
		expect(childStage.current).toBe('childDefault');
	});

	it('Should log an error when current is missing in node mode', () => {
		isNode = true;
		const elem = document.createElement('body');
		const acts = {
			ok: () => <div>Fallback</div>,
		};
		const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

		mount(elem, (
			<StageContext value={{ acts, initial: 'missing', fallback: 'ok', template: Template, register: false }}>
				<Stage />
			</StageContext>
		));

		const tree = elem.tree();
		expect(findText(tree, 'Fallback')).toBe(false);
		expect(errorSpy).toHaveBeenCalled();
	});

	it('Should sync URL segments and query into stage chain', async () => {
		isNode = false;
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/parent/child?q=hello');

		const acts = {
			parent: () => <div>Parent</div>,
		};
		const childActs = {
			child: () => <div>Child</div>,
		};

		let rootStage = null;
		let childStage = null;

		const ChildCapture = StageContext.use(s => () => {
			childStage = s;
			return <Stage />;
		});

		const RootCapture = StageContext.use(s => () => {
			rootStage = s;
			return <div>
				<Stage />
				<StageContext value={{
					acts: childActs,
					template: Template,
					register: false,
				}}>
					<ChildCapture />
				</StageContext>
			</div>;
		});

		mount(elem, (
			<StageContext value={{
				acts,
				template: Template,
				urlRouting: true,
				register: false,
			}}>
				<RootCapture />
			</StageContext>
		));

		await flushMicrotasks(2);

		expect(rootStage.current).toBe('parent');
		expect(childStage.current).toBe('child');
		expect(rootStage.urlProps).toEqual({});
		expect(childStage.urlProps).toEqual({ q: 'hello' });
	});

	it('Should push and replace history based on path changes', async () => {
		isNode = false;
		const elem = document.createElement('body');
		window.history.replaceState({}, '', '/');

		const acts = {
			home: () => <div>Home</div>,
			profile: () => <div>Profile</div>,
		};

		let rootStage = null;
		const Capture = StageContext.use(s => () => {
			rootStage = s;
			return <Stage />;
		});

		const pushSpy = vi.spyOn(history, 'pushState');
		const replaceSpy = vi.spyOn(history, 'replaceState');

		mount(elem, (
			<StageContext value={{
				acts,
				initial: 'home',
				template: Template,
				urlRouting: true,
				register: false,
			}}>
				<Capture />
			</StageContext>
		));

		await flushMicrotasks(2);
		await waitForAnimationFrames(2);
		pushSpy.mockClear();
		replaceSpy.mockClear();

		rootStage.open({ name: 'profile' });
		await flushMicrotasks(2);

		expect(pushSpy).toHaveBeenCalled();

		rootStage.open({ name: 'profile', urlProps: { page: '2' } });
		await flushMicrotasks(2);

		expect(replaceSpy).toHaveBeenCalled();
	});
});
