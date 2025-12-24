import { Observer } from 'destam-dom';

import { mark } from '../../utils/h/h.jsx';

import Theme from '../../utils/Theme/Theme.jsx';
import Shown from '../../utils/Shown/Shown.jsx';
import LoadingDots from '../../utils/LoadingDots/LoadingDots.jsx';
import useRipples from '../../utils/Ripple/Ripple.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

Theme.define({
	button: {
		extends: 'center_radius',
		padding: 10,
		userSelect: 'none',
		border: 'none',
		cursor: 'pointer',
		textDecoration: 'none',
		position: 'relative',
		overflow: 'clip',
		color: '$color_top',
		boxShadow: 'none',
		background: 'none',
		_cssProp_focus: {
			outline: 'none',
		},
	},

	button_contained: {
		extends: 'typography_p1_bold',
		background: '$color',
		color: '$contrast_text($color_top)',
	},

	button_contained_hovered: {
		background: '$color_hover',
	},

	button_outlined: {
		extends: 'typography_p1_bold',
		borderWidth: 2,
		borderStyle: 'solid',
		borderColor: '$color',
		color: '$color',
	},

	button_outlined_hovered: {
		color: '$color_hover',
		borderColor: '$color_hover',
	},

	button_outlined_disabled: {
		borderColor: '$saturate($color, -1)',
		color: '$saturate($color, -1)',
	},

	button_contained_disabled: {
		// temp var
		$bg: '$saturate($color, -1)',
		background: '$bg',
		color: '$contrast_text($bg)',
	},

	button_text: {
		extends: 'typography_p1_regular',
	},

	button_text_hovered: {
		background: 'rgb(0, 0, 0, 0.1)',
	},

	button_round: {
		extends: 'typography_p1_regular',
		borderRadius: '50%',
	},

	button_link: {
		padding: 0,
		color: 'blue',
		textDecoration: 'underline',
	},

	button_link_clicked: {
		color: 'purple',
	},

	button_link_focused: {
		boxShadow: 'none',
	}
});

export default ThemeContext.use(h => {
	const Button = ({
		label = '',
		type = 'text',
		onClick = () => { },
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
		loading = true,
		href,
		clicked = false,
		...props
	}) => {
		if (!(clicked instanceof Observer)) clicked = Observer.mutable(clicked);
		if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);
		if (!(focused instanceof Observer)) focused = Observer.mutable(focused);
		if (!(hover instanceof Observer)) hover = Observer.mutable(hover);

		if (!loading) loading = Observer.immutable(loading)
		else loading = Observer.mutable(false)

		disabled = Observer.all([disabled, loading]).map(([dis, lod]) => !!dis || lod);

		const [ripples, createRipple] = useRipples();

		if (!focused.isImmutable()) props.isFocused = focused;
		if (!hover.isImmutable()) props.isHovered = hover;

		return <button ref
			onClick={(event) => {
				if (disabled.get()) return;
				if (!clicked.get()) clicked.set(true);

				if (onClick) {
					createRipple(event);
					const ret = onClick(event);

					// if the return value is a promise, replace the button with a loading animation.
					if (ret && ret.then && !loading.isImmutable()) {
						loading.set(true);
						ret.catch(console.error).then(() => loading.set(false));
					}
				}
			}}
			onMouseDown={(event) => {
				if (disabled.get()) return;
				if (!clicked.get()) clicked.set(true);

				focused.set(true);
				if (onMouseDown) {
					createRipple(event);
					onMouseDown(event);
				}
			}}
			onMouseUp={(event) => {
				if (disabled.get()) return;

				if (onMouseUp) {
					createRipple(event);
					onMouseUp(event);
				}
			}}
			onKeyDown={(event) => {
				if (!disabled.get() && (event.key === "Enter" || event.key === " ")) {
					event.preventDefault();
					focused.set(true);
					createRipple(event);

					if (onClick) onClick(event);
					if (onMouseDown) onMouseDown(event);
				}
			}}
			onMouseLeave={() => focused.set(false)}
			isFocused={focused}
			style={{
				display: inline ? 'inline-flex' : 'flex',
				...style
			}}
			disabled={disabled}
			{...props}
			theme={[
				'button',
				type,
				hover.bool('hovered', null),
				disabled.bool('disabled', null),
				focused.bool('focused', null),
				clicked.bool('clicked', null),
			]}
		>
			<Shown value={loading}>
				<mark:then>
					<LoadingDots />
				</mark:then>
				<mark:else>
					{iconPosition === 'left' ? icon : null}
					{label}
					{children}
					{iconPosition === 'right' ? icon : null}
					{ripples}
				</mark:else>
			</Shown>
			<Shown value={href}>
				<a
					href={href}
					aria-hidden="true"
					onClick={(e) => e.preventDefault()}
					style={{
						all: "unset",
						pointerEvents: "none",
						display: "contents"
					}}
				/>
			</Shown>
		</button>;
	};

	return Button;
});
