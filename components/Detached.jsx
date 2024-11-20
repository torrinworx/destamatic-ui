import { h } from './h';
import Observer from 'destam/Observer';
import Popup from './Popup';
import Shown from './Shown';
import Button from './Button';

const clamp = (x, l, h) => Math.max(l, Math.min(h, x));

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
};

const Detached = ({ menu, type = 'text', children, enabled, style, icon, focusable = true }) => {
	const focused = enabled || Observer.mutable(false);

	const A = <raw:button />;
	const popup = <raw:div />;

	const computed = Observer.mutable(false);

	const Contents = ({}, cleanup, mounted) => {
		mounted(() => {
			computed.set(true);
		});

		return children;
	};

	return <>
		<Button
			type={[
				type,
				...(focusable ? ['focusable', focused.map(f => f ? 'focused' : null)] : [])
			]}
			Icon={icon}
			style={style}
			ref={A}
			onClick={() => {
				if (typeof focused.get() === 'number') {
					focused.set(false);
					return;
				}

				computed.set(false);
				focused.set(true);
				const bounds = popup.getBoundingClientRect();
				const surround = A.getBoundingClientRect();

				const ww = window.innerWidth;
				const wh = window.innerHeight;

				let fits = [];
				for (const rot of [6, 5, 1, 2, 0, 7, 3, 4]) {
					const calc = calculate(surround, rot);

					if ('right' in calc) calc.left = ww - calc.right - Math.min(bounds.width, calc.maxWidth);
					if ('left' in calc) calc.right = ww - calc.left - Math.min(bounds.width, calc.maxWidth);
					if ('bottom' in calc) calc.top = wh - calc.bottom - Math.min(bounds.height, calc.maxHeight);
					if ('top' in calc) calc.bottom = wh - calc.top - Math.min(bounds.height, calc.maxHeight);

					const width = clamp(ww - calc.right, 0, ww) - clamp(calc.left, 0, ww);
					const height = clamp(wh - calc.bottom, 0, wh) - clamp(calc.top, 0, wh);
					fits.push({ size: width * height, rot });
				}

				fits.sort((a, b) => b.size - a.size);

				if (!fits.length) {
					focused.set(false);
				} else {
					focused.set(fits[0].rot);
				}
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
					visibility: computed.map(c => c ? 'visible' : 'hidden'),
				}}
			>
				<Contents />
			</Popup>
		</Shown>
	</>;
};

export default Detached;
