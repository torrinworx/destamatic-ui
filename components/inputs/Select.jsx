import { mark } from '../utils/h';
import Observer from 'destam/Observer';
import Typography from '../display/Typography';
import Icon from '../display/Icon';
import Paper from '../display/Paper';
import useRipples from '../utils/Ripple';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import Detached from '../utils/Detached';
import Button from '../inputs/Button';

Theme.define({
	select: {
		$radius: '4px',
	},

	select_base: {
		borderRadius: '$radius',
	},

	select_paper: {
		borderRadius: '$radius',
		boxShadow: 'none',
	},

	select_selectable: {
		width: '100%',
		boxSizing: 'border-box',
		overflow: 'clip',
		padding: 10,
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

export default ThemeContext.use(h => {
	const Select = ({ value, options, display, style, theme }, cleanup, mounted) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(options instanceof Observer)) options = Observer.immutable(options);
		if (!display) display = a => a;

		const focused = Observer.mutable(false);
		const selector = value.selector('selected', null);

		const buttonRef = <raw:button />;

		const Popup = Theme.use(themer => ({}, cleanup, mounted) => {
			const Selectable = ({ each: option }) => {
				return <Button
					focused={Observer.immutable(false)}
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

			const foc = Observer.mutable(false);
			mounted(() => {
				requestAnimationFrame(() => {
					foc.set(true);
				});
			});

			const radius = themer(theme, 'select').vars('radius');
			const style = getComputedStyle(buttonRef);

			return <Paper tight theme="select" type={foc.map(f => f ? 'focused' : null)} style={{
				width: style.width,
				overflow: 'auto',

				borderTopLeftRadius: focused.map(f => f !== Detached.TOP_LEFT_RIGHT ? 0 : null),
				borderTopRightRadius: focused.map(f => f !== Detached.TOP_LEFT_RIGHT ? 0 : null),
				borderBottomLeftRadius: focused.map(f => f !== Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
				borderBottomRightRadius: focused.map(f => f !== Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
				clipPath: Observer.all([focused, radius]).map(([f, r]) => {
					if (f === Detached.TOP_LEFT_RIGHT) {
						return `inset(-${r} -${r} 0px -${r})`;
					} else if (f === Detached.BOTTOM_LEFT_RIGHT) {
						return `inset(0px -${r} -${r} -${r})`;
					} else {
						return null;
					}
				}),
			}}>
				<Selectable each={options} />
			</Paper>
		});

		return <Detached enabled={focused} locations={[
			Detached.BOTTOM_LEFT_RIGHT,
			Detached.TOP_LEFT_RIGHT,
		]}>
			<Button
				theme={[]}
				type="select_base"
				ref={buttonRef}
				onMouseDown={e => focused.set(true)}
				focused={Observer.immutable(focused)}
				style={{
					borderTopLeftRadius: focused.map(f => f === Detached.TOP_LEFT_RIGHT ? 0 : null),
					borderTopRightRadius: focused.map(f => f === Detached.TOP_LEFT_RIGHT ? 0 : null),
					borderBottomLeftRadius: focused.map(f => f === Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
					borderBottomRightRadius: focused.map(f => f === Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
					...style,
				}}
			>
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

	return Select;
});
