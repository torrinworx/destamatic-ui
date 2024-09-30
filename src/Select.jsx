import { h } from './h';
import Observer from 'destam/Observer';
import FocusEffect from './FocusEffect';
import Typography from './Typography';
import Icon from './Icon';
import Popup from './Popup';
import Shown from './Shown';
import Paper from './Paper';
import useRipples from './Ripple.jsx';
import Theme from './Theme';

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
	if (!display) display = a => a;

	const focused = Observer.mutable(false);

	const A = <a />;
	const popup = <div />;

	const selector = value.selector('rgba(0, 0, 0, 0.1)', 'none');

	const Selectable = ({each: option}) => {
	    const [ripples, createRipple] = useRipples('rgba(0, 0, 0, 0.3)');

		return <div
			style={{
				width: 'calc(100% - 16px)',
		        display: 'flex',
		        alignItems: 'center',
		        justifyContent: 'center',
		        userSelect: 'none',
		        position: 'relative',
		        overflow: 'clip',
		        font: theme.font,
		        fontSize: '1.3em',
		        padding: 8,
		        cursor: 'pointer',
		        background: selector(option),
			}}
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

	return <FocusEffect
		enabled={focused}
		style={{display: 'inline-block', background: '#DDD', ...style}}
	>
		<A
			onClick={() => {
				if (typeof focused.get() === 'number') {
					focused.set(false);
					return;
				}

				focused.set(true);

				const bounds = popup.getBoundingClientRect();
				const surround = A.getBoundingClientRect();

				let fits = [];
				for (const rot of [6, 5, 1, 2, 0, 7, 3, 4]) {
					const calc = calculate(surround, rot);

					if ('right' in calc) calc.left = window.innerWidth - calc.right - Math.min(bounds.width, calc.maxWidth);
					if ('left' in calc) calc.right = window.innerWidth - calc.left - Math.min(bounds.width, calc.maxWidth);
					if ('bottom' in calc) calc.top = window.innerHeight - calc.bottom - Math.min(bounds.height, calc.maxHeight);
					if ('top' in calc) calc.bottom = window.innerHeight - calc.top - Math.min(bounds.height, calc.maxHeight);

					const isWithin = (val, min, max) => {
						return val >= min && val <= max;
					};

					if (
						isWithin(calc.left, 0, window.innerWidth) && 
						isWithin(calc.right, 0, window.innerWidth) && 
						isWithin(calc.top, 0, window.innerHeight) && 
						isWithin(calc.bottom, 0, window.innerHeight)
					) {
						let width = (window.innerWidth - calc.right) - calc.left;
						let height = (window.innerHeight - calc.bottom) - calc.top;
						fits.push({size: width * height, rot});
					}
				}

				fits.sort((a, b) => b.size - a.size);

				if (!fits.length) {
					focused.set(false);
				} else {
					focused.set(fits[0].rot);
				}
			}}
			style={{
				padding: 10,
				cursor: 'pointer',
				display: 'flex',
			}}
		>
			<Typography type='p1' style={{display: 'inline'}}>
				{value.map(val => {
					if (options.includes(val)) {
						return display(val);
					} else {
						return "None";
					}
				})}
			</Typography>
			<Icon lib="feather" name="play" size={16} style={{marginLeft: 10, transform: 'rotate(90deg)'}} />
		</A>
		<Shown value={focused.map(v => typeof v === 'number' || v === true)}>
			<Popup
				ref={popup}
				placement={focused.map(rot => {
					if (typeof rot !== 'number') return null;

					const bounds = A.getBoundingClientRect();
					return calculate(bounds, rot);
				}).setter(() => focused.set(false))}
				style={{
					visibility: 'visible', 
				}}
			>
				<Paper style={{minWidth: 100, padding: 0, overflow: 'clip'}}>
					<Selectable each={options} />
				</Paper>
			</Popup>
		</Shown>
	</FocusEffect>;
});

export default Select;