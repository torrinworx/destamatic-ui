import { Observer } from 'destam-dom';

import { mark } from '../../utils/h/h.jsx';

import Theme from '../../utils/Theme/Theme.jsx';
import Shown from '../../utils/Shown/Shown.jsx';
import LoadingDots from '../../utils/LoadingDots/LoadingDots.jsx';
import useRipples from '../../utils/Ripple/Ripple.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';
import InputContext from '../../utils/InputContext/InputContext.jsx';

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
		background: '$color_disabled',
		color: '$contrast_text($color_disabled)',
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
		color: '$color_disabled',
	},

	button_text: {
		extends: 'typography_p1_regular_bold',
	},

	button_text_hovered: {
		background: 'rgb(0, 0, 0, 0.1)',
	},

	button_text_disabled: {
		color: '$color_disabled',
	},

	button_link: {
		extends: 'typography_p1_regular',
		userSelect: 'text',
		borderRadius: 'none',
		padding: 1,
		overflow: 'visible',
		color: '$color',
		textDecoration: 'underline',
	},

	button_link_hovered: {
		textDecorationThickness: '3px'
	},

	button_link_disabled: {
		color: '$color_disabled',
	},

	button_link_clicked: {
		color: 'purple',
	},

	button_round: {
		borderRadius: '50%',
	},

	button_loading: {
		cursor: 'wait',
	},
});

export default InputContext.use(input => ThemeContext.use(h => {
	const Button = ({
		id = null,
		track = true,
		label = '',
		type = 'contained',

		// IMPORTANT: default null so we can detect "user provided onClick"
		onClick = null,

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
		loading,
		href,
		hrefNewTab = true,
		clicked = false,
		...props
	}) => {
		// enforce "hrefNewTab is the only control prop"
		if ('target' in props) delete props.target;
		if ('rel' in props) delete props.rel;

		if (!(clicked instanceof Observer)) clicked = Observer.mutable(clicked);
		if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);
		if (!(focused instanceof Observer)) focused = Observer.mutable(focused);
		if (!(loading instanceof Observer) && loading != false) loading = Observer.mutable(loading);
		else loading = Observer.immutable(false);
		if (!(iconPosition instanceof Observer)) iconPosition = Observer.mutable(iconPosition);
		if (!(hover instanceof Observer)) hover = Observer.mutable(hover);

		if (!(round instanceof Observer)) round = Observer.immutable(round);
		if (!(track instanceof Observer)) track = Observer.immutable(track);

		if (!(hrefNewTab instanceof Observer)) hrefNewTab = Observer.immutable(hrefNewTab);

		disabled = Observer.all([disabled, loading]).map(([dis, lod]) => !!dis || lod);

		const [ripples, createRipple] = useRipples();

		if (!focused.isImmutable()) props.isFocused = focused;
		if (!hover.isImmutable()) props.isHovered = hover;

		const hasUserOnClick = typeof onClick === 'function';

		const handleLoading = (value) => {
			if (value && value.then && !loading.isImmutable()) {
				loading.set(true);
				value.catch(console.error).then(() => loading.set(false));
			}
		};

		const hasTextOrChildren = !!label ||
			(Array.isArray(children) ? children.length > 0 : !!children);

		const trackClick = (event) => {
			if (!track.get()) return;
			InputContext.fire(input, 'click', {
				id,
				component: 'Button',
				label,
				title: props.title,
				href,
				event,
			});
		};

		const activate = (event) => {
			if (disabled.get()) return;
			if (!clicked.get()) clicked.set(true);

			trackClick(event);

			if (hasUserOnClick) {
				createRipple(event);
				handleLoading(onClick(event));
			}
		};

		// If href exists, we render a real <a> for crawlers + right click / middle click.
		// If the user ALSO provided onClick, we prevent default only for normal left-click,
		// and run onClick instead (SPA navigation).
		const onLinkClick = (event) => {
			if (disabled.get()) {
				event.preventDefault();
				return;
			}

			// let the browser handle: middle click, cmd/ctrl click, open-in-new-tab, etc
			if (
				event.button !== 0 ||
				event.metaKey ||
				event.ctrlKey ||
				event.shiftKey ||
				event.altKey
			) return;

			if (hasUserOnClick) event.preventDefault();

			// run SPA click (or just tracking)
			if (hasUserOnClick) activate(event);
			else trackClick(event);
		};

		const resolveTag = (href) => href ? 'a' : 'button';
		const TagName = resolveTag(href);

		return <TagName
			ref
			aria-label={props['aria-label'] ?? props.title}

			href={href || undefined}
			target={href ? hrefNewTab.map(n => n ? '_blank' : undefined) : undefined}
			rel={href ? hrefNewTab.map(n => n ? 'noopener noreferrer' : undefined) : undefined}

			aria-disabled={href ? disabled : undefined}
			tabIndex={href ? disabled.map(d => d ? -1 : (props.tabIndex ?? 0)) : props.tabIndex}

			role={href ? (props.role ?? 'link') : props.role}
			type={!href ? (props.type ?? 'button') : undefined}

			onClick={(event) => {
				if (href) return onLinkClick(event);
				activate(event);
			}}

			onMouseDown={(event) => {
				if (disabled.get()) return;
				if (!clicked.get()) clicked.set(true);
				if (!focused.isImmutable()) focused.set(true);

				if (track.get()) {
					InputContext.fire(input, 'press', {
						id,
						component: 'Button',
						label,
						event,
					});
				}

				// back to old behavior: only ripple here if user provided onMouseDown
				if (onMouseDown) {
					createRipple(event);
					handleLoading(onMouseDown(event));
				}
			}}

			onMouseUp={(event) => {
				if (disabled.get()) return;

				if (track.get()) {
					InputContext.fire(input, 'release', {
						id,
						component: 'Button',
						label,
						event,
					});
				}

				if (onMouseUp) handleLoading(onMouseUp(event));
			}}

			onKeyDown={(event) => {
				if (!disabled.get() && (event.key === "Enter" || event.key === " ")) {
					// keep button-like keyboard behavior for actual buttons only
					if (!href) {
						event.preventDefault();
						focused.set(true);
						createRipple(event);

						if (track.get()) {
							InputContext.fire(input, 'enter', {
								id,
								component: 'Button',
								label,
								event,
							});
						}

						if (hasUserOnClick) handleLoading(onClick(event));
						if (onMouseDown) handleLoading(onMouseDown(event));
					}
				}
			}}

			onMouseLeave={() => {
				if (!focused.isImmutable()) focused.set(false);
			}}

			style={{
				display: inline ? 'inline-flex' : 'flex',
				...style,
			}}

			disabled={!href ? disabled : undefined}
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
					<LoadingDots type={type} />
				</mark:then>
				<mark:else>
					{iconPosition.map(s => s === 'left' && icon
						? <div style={hasTextOrChildren ? { marginRight: 4 } : null}>{icon}</div>
						: null)}
					{label}
					{children}
					{Observer.immutable(type).map(t => t === 'link' ? null : ripples)}
					{iconPosition.map(s => s === 'right' && icon
						? <div style={hasTextOrChildren ? { marginLeft: 4 } : null}>{icon}</div>
						: null)}
				</mark:else>
			</Shown>
		</TagName>;
	};

	return Button;
}));
