import { Observer } from 'destam-dom';
import { mark } from './h';
import Theme from './Theme';
import Button from './Button';

Theme.define({
	button_tab: {
		width: '100%',
		borderRadius: 0,
	},

	tab_body: {
		display: 'flex',
		flexDirection: 'column',
	},

	tab_selector: {
		display: 'flex',
		width: '100%',
		alignItems: 'flex-start',
	},

	tab_highlight: {
		extends: 'primary',
		background: '$color',
		height: 4,
		borderRadius: 2,
		position: 'relative',
		transition: 'left 250ms ease',
	},
});

const Tabs = ({selected, children, ...props}) => {
	const tabs = new Map();
	let def;
	for (const child of children) {
		if (child instanceof mark && child.name === 'tab') {
			tabs.set(child.props.name, {
				children: child.props.children,
				sel: child.props.name,
				name: child.props.display ?? child.props.name,
			});

			if (!def) def = child.props.name;
		} else {
			throw new Error("All tab elements must only have <mark:tab> children");
		}
	}

	if (!(selected instanceof Observer)) selected = Observer.mutable(selected);
	selected = selected.def(def);

	const Tab = ({each: tab}) => {
		return <Button type="tab" label={tab.name} onClick={() => {
			selected.set(tab.sel);
		}} />;
	};

	return <div theme="tab_body" {...props}>
		<div theme="tab_selector">
			<Tab each={tabs.values()} />
		</div>
		<div theme="tab_highlight" style={{
			width: `${100 / tabs.size}%`,
			left: selected.map(sel => `${100 / tabs.size * [...tabs.keys()].indexOf(sel)}%`),
		}} />
		{selected.map(sel => tabs.get(sel)?.children ?? null)}
	</div>;
};

export default Tabs;
