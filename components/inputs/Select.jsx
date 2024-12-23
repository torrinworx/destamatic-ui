import { h, mark } from '../utils/h';
import Observer from 'destam/Observer';
import Typography from '../display/Typography';
import Icon from '../display/Icon';
import Paper from '../display/Paper';
import useRipples from '../utils/Ripple';
import Theme from '../utils/Theme';
import Detached from '../utils/Detached';
import Button from '../inputs/Button';

Theme.define({
	select_selectable: {
		width: '100%',
		boxSizing: 'border-box',
		overflow: 'clip',
		borderRadius: 0,
	},

	select_selected: {
		background: '$shiftBrightness($invert($color_top), 0.2)',
	},

	select_selected_hovered: {
		background: '$shiftBrightness($invert($color_top), 0.2)',
	},

	select_hovered: {
		background: '$shiftBrightness($invert($color_top), 0.1)',
	},
});

const Select = ({ value, options, display, style }) => {
	if (!(value instanceof Observer)) value = Observer.immutable(value);
	if (!(options instanceof Observer)) options = Observer.immutable(options);
	if (!display) display = a => a;

	const focused = Observer.mutable(false);
	const selector = value.selector('selected', null);

	const buttonRef = <raw:button />;

	const Popup = ({}, cleanup, mounted) => {
		const Selectable = ({ each: option }) => {
			return <Button
				type={[
					"select_selectable",
					selector(option)
				]}
				onMouseUp={e => {
					value.set(option);
					focused.set(false);
				}}
			>
				{display(option)}
			</Button>;
		};

		return <Paper tight style={{ minWidth: buttonRef.clientWidth, overflow: 'auto' }}>
			<Selectable each={options} />
		</Paper>
	};

	return <Detached enabled={focused}>
		<Button ref={buttonRef} style={style} onMouseDown={e => focused.set(true)}>
			<Typography type='p1' inline>
				{value.map(val => {
					if (options.get().includes(val)) {
						return display(val);
					} else {
						return "None";
					}
				})}
			</Typography>
			<Icon
				lib="feather"
				name="chevron-down"
				size={16}
				style={{
					marginLeft: 10,
					transform: focused.map(f => f ? 'rotate(180deg)' : null),
					transition: 'transform 100ms ease-in-out',
				}}
			/>
		</Button>

		<mark:popup>
			<Popup />
		</mark:popup>
	</Detached>;
};

export default Select;
