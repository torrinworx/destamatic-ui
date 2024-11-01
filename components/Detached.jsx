import { h } from './h';
import Observer from 'destam/Observer';
import FocusEffect from './FocusEffect';
import Popup from './Popup';
import Shown from './Shown';
import Button from './Button';

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

const Detached = ({menu, children, enabled, style}) => {
	const focused = enabled || Observer.mutable(false);

	const A = <button />;
	const popup = <div />;

	return <FocusEffect
		enabled={focused}
		style={{display: 'inline-block', ...style}}
	>
		<Button
			ref={A}
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
			{menu}
		</Button>
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
				{children}
			</Popup>
		</Shown>
	</FocusEffect>;
};

export default Detached;
