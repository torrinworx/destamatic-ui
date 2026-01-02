import { Observer } from 'destam-dom';

import { h } from '../../utils/h/h.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

import Button from '../../inputs/Button/Button.jsx';
import Shown from '../../utils/Shown/Shown.jsx';
import { Icon } from '../../display/Icon/Icon.jsx';

export default ThemeContext.use(h => {
	const DropDown = ({
		arrow = 'right',
		open = Observer.mutable(false),
		iconOpen = <Icon size="20" name="chevron-down" />,
		iconClose = <Icon size="20" name="chevron-down" />,
		label = '',
		type = 'text',
		onClick,
		inline,
		onMouseDown,
		onMouseUp,
		icon = null,
		style,
		disabled,
		hover,
		focused,
		children,
		iconPosition = 'left',
		loading,
		href,
		...props
	}) => {
		if (!(open instanceof Observer)) open = Observer.mutable(open);
		if (!(focused instanceof Observer)) focused = Observer.mutable(focused);
		if (!(hover instanceof Observer)) hover = Observer.mutable(hover);

		return <div style={style}>
			<Button
				type={type}
				iconPosition={arrow === 'right' ? 'right' : 'left'}
				label={label}
				icon={open.map(show => (show ? iconOpen : iconClose))}
				onClick={(event) => {
					open.set(!open.get());
					if (onClick) onClick(event);
				}}
				inline={inline}
				onMouseDown={onMouseDown}
				onMouseUp={onMouseUp}
				disabled={disabled}
				hover={hover}
				focused={focused}
				loading={loading}
				href={href}
				{...props}
				style={{
					maxWidth: 'none',
					display: 'flex',
					justifyContent: 'space-between',
					width: '100%', height: '100%'
				}}
			/>
			<Shown value={open}>
				{children}
			</Shown>
		</div>;
	};

	return DropDown;
});
