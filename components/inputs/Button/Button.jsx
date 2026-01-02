import { Observer } from 'destam-dom';

import { mark } from '../../utils/h/h.jsx';

import Theme from '../../utils/Theme/Theme.jsx';
import Shown from '../../utils/Shown/Shown.jsx';
import LoadingDots from '../../utils/LoadingDots/LoadingDots.jsx';
import useShine from '../../utils/Shine/Shine.jsx';
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
		color: '$color',
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

	button_contained_disabled: {
		$bg: '$saturate($color, -1)',
		background: '$bg',
		color: '$contrast_text($bg)',
	},

	button_outlined: {
		extends: 'typography_p1_bold',
		borderWidth: 2,
		borderStyle: 'solid',
	},

	button_outlined_hovered: {
		background: 'rgb(0, 0, 0, 0.1)',
	},

	button_outlined_disabled: {
		color: '$saturate($color, -1)',
	},

	button_text: {
		extends: 'typography_p1_regular',
	},

	button_text_hovered: {
		background: 'rgb(0, 0, 0, 0.1)',
	},

	button_text_disabled: {
		color: '$saturate($color, -1)',
	},

	button_link: {
		userSelect: 'text',
		extends: 'typography_p1_regular',
		borderRadius: 'none',
		padding: 1,
		overflow: 'visible',
		color: 'blue',
		textDecoration: 'underline',
	},

	button_link_hovered: {
		textDecorationThickness: '3px'
	},

	button_link_disabled: {
		color: '$saturate($color, -1)',
	},

	// TODO: Somehow disable transition for just clicked? it feels weird on mobile when clicking a link and it takes a second to transition to the clicked state

	button_link_clicked: {
		color: 'purple',
	},

	button_round: {
		extends: 'typography_p1_regular',
		borderRadius: '50%',
	},

	button_loading: {
		cursor: 'wait',
	},
});

/*
TODO: Make LoadingDots style consistent with typography so that it doesn't adjust the size of the button
when appearing during a promise.

TODO: On mobile, button taps feel really slow and laggy. Something needs to change be improved somehow, maybe onPointerDown? or some other event listener should be used? the current onClick is really slow on mobile touch screens.
*/

export default ThemeContext.use(h => {
	const Button = ({
		label = '',
		type = 'contained',
		onClick = () => { },
		inline,
		onMouseDown,
		onMouseUp,
		round = false,
		icon = null,
		iconPosition = 'left',
		style,
		disabled,
		hover,
		focused,
		children,
		loading = true,
		href,
		clicked = false,
		shine = false,
		...props
	}, _, mounted) => {
		if (!(clicked instanceof Observer)) clicked = Observer.mutable(clicked);
		if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);
		if (!(focused instanceof Observer)) focused = Observer.mutable(focused);
		if (!(hover instanceof Observer)) hover = Observer.mutable(hover);

		if (!(type instanceof Observer)) type = Observer.immutable(type);
		if (!(round instanceof Observer)) round = Observer.immutable(round);

		if (!loading) loading = Observer.immutable(loading)
		else loading = Observer.mutable(false)

		disabled = Observer.all([disabled, loading]).map(([dis, lod]) => !!dis || lod);

		const [ripples, createRipple] = useRipples();
		const [shines, createShine] = useShine();

		if (!focused.isImmutable()) props.isFocused = focused;
		if (!hover.isImmutable()) props.isHovered = hover;

		const handleLoading = (value) => {
			if (value && value.then && !loading.isImmutable()) {
				loading.set(true);
				value.catch(console.error).then(() => loading.set(false));
			}
		};

		const hasTextOrChildren = !!label ||
			(Array.isArray(children) ? children.length > 0 : !!children);

		const showLeftIcon = icon && iconPosition === 'left';
		const showRightIcon = icon && iconPosition === 'right';

		mounted(() => {
			if (shine) createShine();
		});

		return <button
			ref
			aria-label={props['aria-label'] ?? props.title}
			onClick={(event) => {
				if (disabled.get()) return;
				if (!clicked.get()) clicked.set(true);

				if (onClick) {
					createRipple(event);
					handleLoading(onClick(event));
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

					if (onClick) handleLoading(onClick(event));
					if (onMouseDown) handleLoading(onMouseDown(event))
				}
			}}
			onMouseLeave={() => focused.set(false)}
			isFocused={focused}
			style={{
				display: inline ? 'inline-flex' : 'flex',
				...style,
			}}
			disabled={disabled}
			{...props}
			theme={[
				'button',
				type,
				round.bool('round', null),
				hover.bool('hovered', null),
				focused.bool('focused', null),
				loading.bool('loading', null),
				disabled.bool('disabled', null),
				Observer.all([disabled, clicked]).map(([d, c]) => c && !d ? 'clicked' : null),
			]}
		>
			<Shown value={loading}>
				<mark:then>
					<LoadingDots />
				</mark:then>
				<mark:else>
					{showLeftIcon
						? <div style={hasTextOrChildren ? { marginRight: 4 } : null}>{icon}</div>
						: null}
					{label}
					{children}
					{showRightIcon
						? <div style={hasTextOrChildren ? { marginLeft: 4 } : null}>{icon}</div>
						: null}

					{type.map(t => t === 'link' ? null : <>
						{shines}
						{ripples}
					</>)}
				</mark:else>
			</Shown>
			<Shown value={href}>
				<a
					href={href}
					aria-hidden="true"
					onClick={e => e.preventDefault()}
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
