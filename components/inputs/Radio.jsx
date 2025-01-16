import Observer from 'destam/Observer';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import Typography from '../display/Typography';

Theme.define({
	radio_label: {
		display: 'flex',
		flexDirection: 'row',
		gap: 10,
	},

	radio_typography: {
		extends: 'center',
	},

	radio_ring: {
		extends: 'center',
		position: 'relative',
		borderRadius: '50%',
		width: '80%',
		height: '80%',
		cursor: 'pointer',

		$size: 30,
	},

	radio_ring_1: {
		background: '$alpha($color, 0.8)',
		width: '$size$px',
		height: '$size$px',
	},

	radio_ring_1_selected: {
		background: '$color',
	},

	radio_ring_2: {
		background: '$invert($color_top)',
	},

	radio_ring_3: {
		transition: 'width 100ms ease-in-out, height 100ms ease-in-out',
		background: '$color',
		width: 0,
		height: 0,
	},

	radio_ring_3_hovered: {
		background: '$color',
		width: '20%',
		height: '20%',
	},

	radio_ring_3_selected: {
		background: '$color',
		width: '80%',
		height: '80%',
	},
});

export default ThemeContext.use(h => {
	const Radio = (sel) => {
		const selector = sel.selector('selected', null);

		return ({ style, value, label }) => {
			const hovered = Observer.mutable(false);
			const hoveredTheme = hovered.map(h => h ? 'hovered' : null);
			const selected = selector(value);

			let out = <div
				isHovered={hovered}
				onClick={e => {
					e.preventDefault();
					sel.set(value);
				}}
				style={style}
				theme={['radio', 'ring', '1', hoveredTheme, selected]}>
				<div theme={['radio', 'ring', '2', hoveredTheme, selected]}>
					<div theme={['radio', 'ring', '3', hoveredTheme, selected]} />
				</div>
			</div>;

			if (label) {
				out = <div theme={['radio', 'label']}>
					{out}
					<Typography type="h6_radio" label={label} />
				</div>;
			}

			return out;
		};
	};

	return Radio;
});
