import { Observer } from 'destam-dom';

import { h } from '../../utils/h/h.jsx';
import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

import Shown from '../../utils/Shown/Shown.jsx';
import useRipples from '../../utils/Ripple/Ripple.jsx';
import { Icon } from '../../display/Icon/Icon.jsx';

Theme.define({
	dropdown: {
		extends: 'center_radius',
		padding: 10,
		userSelect: 'none',
		cursor: 'pointer',
		position: 'relative',
		overflow: 'clip',
		background: 'none',
		border: 'none',
		_cssProp_focus: { outline: 'none' },
	},

	dropdown_hovered: {
		background: 'rgb(0, 0, 0, 0.1)',
	},

	dropdown_row: {
		extends: 'row_fill_spread',
	},
});

export default ThemeContext.use(h => {
	const DropDown = ({
		children,
		label,
		arrow = 'right',
		style,
		open = Observer.mutable(false),
		iconOpen = <Icon size="20" name="chevron-down" />,
		iconClose = <Icon size="20" name="chevron-down" />,
		hover,
		focused,
		...props
	}) => {
		if (!(open instanceof Observer)) open = Observer.mutable(open);
		if (!(focused instanceof Observer)) focused = Observer.mutable(false);
		if (!(hover instanceof Observer)) hover = Observer.mutable(false);

		const toggle = () => open.set(!open.get());
		const [ripples, createRipple] = useRipples();

		if (!focused.isImmutable()) props.isFocused = focused;
		if (!hover.isImmutable()) props.isHovered = hover;

		return <div style={style}>
			<div
				ref
				{...props}
				theme={[
					'dropdown',
					hover.bool('hovered', null),
					focused.bool('focused', null),
				]}
				onMouseEnter={() => hover.set(true)}
				onMouseLeave={() => {
					hover.set(false);
					focused.set(false);
				}}
				onMouseDown={(event) => {
					focused.set(true);
					createRipple(event);
					toggle();
				}}
				onKeyDown={(event) => {
					if (event.key === 'Enter' || event.key === ' ') {
						event.preventDefault();
						focused.set(true);
						createRipple(event);
						toggle();
					}
				}}
			>
				<div theme={['row_fill_spread']}>
					{arrow === 'right' ? <span>{label}</span> : null}

					<i class="chevron-icon" style={{ display: 'flex', alignItems: 'center' }}>
						{open.map(show => (show ? iconOpen : iconClose))}
					</i>

					{arrow === 'left' ? <span>{label}</span> : null}
				</div>

				{ripples}
			</div>

			<Shown value={open} children={children} />
		</div>;
	};

	return DropDown;
});
