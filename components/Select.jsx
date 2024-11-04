import { h } from './h';
import Observer from 'destam/Observer';
import Typography from './Typography';
import Icon from './Icon';
import Popup from './Popup';
import Shown from './Shown';
import Paper from './Paper';
import useRipples from './Ripple.jsx';
import Theme from './Theme';
import Detached from './Detached';

Theme.define({
	select_selectable: {
		width: '100%',
		boxSizing: 'border-box',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		userSelect: 'none',
		position: 'relative',
		overflow: 'clip',
		padding: 8,
		cursor: 'pointer',
	},

	selected: {
		background: '#CCCCCC'
	},
});

const calculate = (bounds, rot) => {
	const cardinals = [
		bounds.left, bounds.top,
		bounds.right, bounds.top,
		bounds.right, bounds.bottom,
		bounds.left, bounds.bottom
	];

	const cardIndex = rot & 0x6;
	let x = cardinals[cardIndex];
	let y = cardinals[cardIndex + 1];

	const xProp = ['right', 'left'][(rot & 1) ^ (rot >> 2)];
	const yProp = ['top', 'bottom'][(rot & 1) ^ ((rot >> 1) & 1) ^ (rot >> 2)];

	if (xProp === 'right') {
		x = window.innerWidth - x;
	}

	if (yProp === 'bottom') {
		y = window.innerHeight - y;
	}

	return {
		[xProp]: x,
		[yProp]: y,
		maxWidth: window.innerWidth - x,
		maxHeight: window.innerHeight - y,
	};
}

export const Select = Theme.use(theme => ({value, options, display, style}) => {
	if (!(value instanceof Observer)) value = Observer.immutable(value);
	if (!(options instanceof Observer)) options = Observer.immutable(options);
	if (!display) display = a => a;

	const focused = Observer.mutable(false);
	const selector = value.selector('selected', null);

	const Selectable = ({each: option}) => {
		const [ripples, createRipple] = useRipples('rgba(0, 0, 0, 0.3)');

		return <div
			theme={[
				"select_selectable",
				selector(option)
			]}
			onClick={e => {
				createRipple(e);
				value.set(option);
				focused.set(false);
			}}
		>
			{display(option)}
			{ripples}
		</div>;
	};

	return <Detached style={style} enabled={focused} menu={
		<>
			<Typography type='p1' style={{display: 'inline'}}>
				{value.map(val => {
					if (options.get().includes(val)) {
						console.log(val);
						return display(val);
					} else {
						return "None";
					}
				})}
			</Typography>
			<Icon lib="feather" name="play" size={16} style={{marginLeft: 10, transform: 'rotate(90deg)'}} />
		</>
	}>
		<Paper style={{minWidth: 100, padding: 0, overflow: 'auto'}}>
			<Selectable each={options} />
		</Paper>
	</Detached>;
});

export default Select;
