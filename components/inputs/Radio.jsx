import Observer from 'destam/Observer';

import Theme from '../utils/Theme';
import useRipples from '../utils/Ripple';
import { Typography } from '../display/Typography';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	radio_label: {
		extends: 'typography_h6',

		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
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
		overflow: 'clip',
		border: '3px solid $color',
		width: '$size$px',
		height: '$size$px',
	},

	radio_ring_2: {
		background: 'transparent',
		width: '100%',
		height: '100%'
	},

	radio_ring_3: {
		// Use a scale transform instead of explicit width/height expansions.
		// This helps avoid jitter and feels more fluid.
		transition: 'transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1), background-color 150ms ease-in-out',
		background: '$color',
		borderRadius: '50%',
		width: '100%',
		height: '100%',
		transform: 'scale(0)',
	},

	radio_ring_3_hovered: {
		transform: 'scale(0.2)',
	},

	radio_ring_3_selected: {
		transform: 'scale(0.65)',
	}
});

export default sel => ThemeContext.use(h => {
	const selector = sel.selector('selected', null);

	const Radio = ({ value, label }) => {
		const hovered = Observer.mutable(false);
		const hoveredTheme = hovered.map(h => h ? 'hovered' : null);
		const selected = selector(value);
		const [ripples, createRipple] = useRipples();

		let out = <div
			isHovered={hovered}
			onClick={e => {
				createRipple(e);
				e.preventDefault();
				sel.set(value);
			}}

			theme={['radio', 'ring', '1', hoveredTheme]}>
			<div theme={['radio', 'ring', '2', hoveredTheme]} >
				<div theme={['radio', 'ring', '3', hoveredTheme, selected]} />
			</div>
			{ripples}
		</div>;

		if (label) {
			out = <div theme={['radio', 'label']}>
				{out}
				{typeof label === 'string' ? <Typography type='p1' label={label} /> : label}
			</div>;
		}

		return out;
	};

	return Radio;
});
