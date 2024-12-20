import { h } from '../utils/h';
import Observer from 'destam/Observer';
import Typography from '../display/Typography';
import Icon from '../display/Icon';
import Paper from '../display/Paper';
import useRipples from '../utils/Ripple';
import Theme from '../utils/Theme';
import Detached from '../utils/Detached';

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

	select_selected: {
		background: '#CCCCCC'
	},
});

export const Select = ({ value, options, display, style, menu }) => {
	if (!(value instanceof Observer)) value = Observer.immutable(value);
	if (!(options instanceof Observer)) options = Observer.immutable(options);
	if (!display) display = a => a;

	const focused = Observer.mutable(false);
	const selector = value.selector('selected', null);

	const Selectable = ({ each: option }) => {
		const [ripples, createRipple] = useRipples();

		return <div
			theme={[
				"select_selectable",
				selector(option)
			]}
			onMouseDown={e => {
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
		menu ? menu :
			<>
				<Typography type='p1' style={{ display: 'inline' }}>
					{value.map(val => {
						if (options.get().includes(val)) {
							return display(val);
						} else {
							return "None";
						}
					})}
				</Typography>
				<Icon lib="feather" name="play" size={16} style={{ marginLeft: 10, transform: 'rotate(90deg)' }} />
			</>
	}>
		<Paper style={{ minWidth: 100, padding: 0, overflow: 'auto' }}>
			<Selectable each={options} />
		</Paper>
	</Detached>;
};

export default Select;
