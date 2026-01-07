import { Observer } from 'destam-dom';

import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';
import InputContext from '../../utils/InputContext/InputContext.jsx';

Theme.define({
	slider: {
		position: 'relative',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		padding: 12,
		boxSizing: 'border-box',
		userSelect: 'none',
		touchAction: 'none',
		cursor: 'pointer',
		outline: 'none',
		_cssProp_focus: {
			outline: 'none',
		},
	},

	slider_horizontal: { width: 220, height: 44 },
	slider_vertical: { width: 44, height: 220 },

	sliderrail: {
		position: 'relative',
		width: '100%',
		height: '100%',
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		userSelect: 'none',
	},

	slidertrack: {
		position: 'relative',
		width: '100%',
		height: 6,
		borderRadius: 999,

		background: '$alpha($color_top, 0.2)',
		overflow: 'clip',
		pointerEvents: 'none',
		userSelect: 'none',
	},

	slidertrack_vertical: { width: 6, height: '100%' },

	slidertrack_hovered: { background: '$alpha($color_top, 0.28)' },
	slidertrack_disabled: { background: '$alpha($color_top, 0.12)' },

	slidercover: {
		position: 'absolute',
		left: 0,
		top: 0,
		height: '100%',
		width: '0%',

		background: '$color',
		borderRadius: 999,
		pointerEvents: 'none',
		userSelect: 'none',
	},

	slidercover_vertical: {
		left: 0,
		top: 'auto',
		bottom: 0,
		width: '100%',
		height: '0%',
	},

	slidercover_hovered: { background: '$color_hover' },
	slidercover_disabled: { background: '$saturate($color, -1)' },

	sliderthumb: {
		position: 'absolute',
		left: '0%',
		top: '50%',

		width: 20,
		height: 20,
		borderRadius: '50%',

		background: '$color',
		transform: 'translate(-50%, -50%) scale(1)',
		transition: 'transform 150ms cubic-bezier(0.4, 0.0, 0.2, 1), background-color 150ms ease-in-out',
		boxShadow: '0 2px 8px $alpha($color_top, 0.25)',
		userSelect: 'none',
	},

	sliderthumb_vertical: {
		left: '50%',
		top: '0%',
		transform: 'translate(-50%, -50%) scale(1)',
	},

	sliderthumb_hovered: {
		background: '$color_hover',
		transform: 'translate(-50%, -50%) scale(1.1)',
	},

	sliderthumb_vertical_hovered: {
		transform: 'translate(-50%, -50%) scale(1.1)',
	},

	sliderthumb_disabled: {
		background: '$saturate($color, -1)',
		boxShadow: 'none',
	},
});

export default InputContext.use(input => ThemeContext.use(h => {
	const clamp = (v, min, max) => Math.min(max, Math.max(min, v));

	const snapToStep = (v, min, step) => {
		step = parseFloat(step);
		if (!Number.isFinite(step) || step <= 0) return v;

		const snapped = min + Math.round((v - min) / step) * step;
		const decimals = (String(step).split('.')[1] || '').length;
		return parseFloat(snapped.toFixed(decimals));
	};

	const normalize = (v, min, max, step) => clamp(snapToStep(v, min, step), min, max);

	const keyFromEvent = (e) => {
		let k = e?.key || e?.code || '';
		const code = e?.keyCode ?? e?.which ?? 0;

		if (k === 'Left') k = 'ArrowLeft';
		if (k === 'Right') k = 'ArrowRight';
		if (k === 'Up') k = 'ArrowUp';
		if (k === 'Down') k = 'ArrowDown';

		if (!k && code) {
			const map = {
				37: 'ArrowLeft',
				38: 'ArrowUp',
				39: 'ArrowRight',
				40: 'ArrowDown',
				33: 'PageUp',
				34: 'PageDown',
				36: 'Home',
				35: 'End',
			};
			k = map[code] || '';
		}

		return k;
	};

	const Slider = ({
		id = null,
		track = true,
		value,
		disabled,
		min,
		max,
		step,
		type = 'horizontal',
		cover = true,
		expand = false,
		hover,
		focused,
		style,
		ref,
		styleThumb,
		styleTrack,
		children,
		...props
	}, cleanup, mounted) => {
		if (!(value instanceof Observer)) value = Observer.mutable(value);
		if (!(hover instanceof Observer)) hover = Observer.mutable(false);
		if (!(focused instanceof Observer)) focused = Observer.mutable(false);

		// Slider deafults
		if (!(min instanceof Observer)) min = Observer.immutable(0);
		if (!(max instanceof Observer)) max = Observer.immutable(1);
		if (!(step instanceof Observer)) step = Observer.immutable(0.01);

		if (!(type instanceof Observer)) type = Observer.immutable(type);
		if (!(expand instanceof Observer)) expand = Observer.immutable(!!expand);
		if (!(cover instanceof Observer)) cover = Observer.immutable(cover !== false);
		if (!(disabled instanceof Observer)) disabled = Observer.immutable(!!disabled);
		if (!(track instanceof Observer)) track = Observer.immutable(track);

		const isVertical = type.map(t => {
			if (t === 'vertical') return true;
			if (t === 'horizontal') return false;
		});

		const rootRef = (ref instanceof Observer) ? ref : Observer.mutable(null);
		const railRef = Observer.mutable(null);
		const dragging = Observer.mutable(false);

		const safeMin = min.map(v => parseFloat(v));
		const safeMax = max.map(v => parseFloat(v));

		const percent = Observer.all([value, safeMin, safeMax]).map(([v, mn, mx]) => {
			v = parseFloat(v);
			if (!Number.isFinite(mn)) mn = 0;
			if (!Number.isFinite(mx)) mx = 1;
			if (!Number.isFinite(v)) v = mn;
			if (mx === mn) return 0;
			return clamp((v - mn) / (mx - mn), 0, 1);
		});

		const dragStartValue = Observer.mutable(null);

		const fire = (type, payload) => {
			if (!track.get()) return;
			InputContext.fire(input, type, {
				id,
				component: 'Slider',
				...payload,
			});
		};

		const setFromEvent = (event) => {
			const el = railRef.get();
			if (!el) return;

			const mn = safeMin.get();
			const mx = safeMax.get();
			if (!Number.isFinite(mn) || !Number.isFinite(mx) || mx === mn) return;

			const rect = el.getBoundingClientRect();
			const vert = !!isVertical.get();

			let p;
			if (vert) p = (rect.bottom - event.clientY) / rect.height;
			else p = (event.clientX - rect.left) / rect.width;

			p = clamp(p, 0, 1);

			const raw = mn + p * (mx - mn);
			const next = normalize(raw, mn, mx, step.get());

			if (!disabled.get() && !value.isImmutable()) value.set(next);
		};

		const stopWindowDrag = { fn: null };
		const stopDrag = () => {
			dragging.set(false);

			if (stopWindowDrag.fn) {
				stopWindowDrag.fn();
				stopWindowDrag.fn = null;
			}

			// treat "pointer up" as slide end
			const start = dragStartValue.get();
			const end = value.get();

			if (start !== null) {
				fire('slide', {
					start,
					end,
					min: safeMin.get(),
					max: safeMax.get(),
					step: step.get(),
				});
			}

			dragStartValue.set(null);
		};

		mounted(() => cleanup(stopDrag));

		if (!focused.isImmutable()) props.isFocused = focused;
		if (!hover.isImmutable()) props.isHovered = hover;

		mounted(() => cleanup(Observer.all([value, safeMin, safeMax, step]).effect(([v, mn, mx, st]) => {
			if (disabled.get() || value.isImmutable()) return;

			v = parseFloat(v);
			if (!Number.isFinite(v) || !Number.isFinite(mn) || !Number.isFinite(mx)) return;

			const next = normalize(v, mn, mx, st);
			if (next !== v) value.set(next);
		})));

		const applyStep = (dir, event, key) => {
			if (!dir) return;

			if (disabled.get()) return;
			if (value.isImmutable()) return;

			const mn = safeMin.get();
			const mx = safeMax.get();
			if (!Number.isFinite(mn) || !Number.isFinite(mx) || mx === mn) return;

			let st = parseFloat(step.get() || 1);
			if (!Number.isFinite(st) || st <= 0) st = 1;

			let v = parseFloat(value.get());
			if (!Number.isFinite(v)) v = mn;

			event.preventDefault();
			event.stopPropagation();

			const before = value.get();

			focused.set(true);
			value.set(normalize(v + dir * st, mn, mx, st));

			const after = value.get();
			if (before !== after) {
				fire('slideKey', { key, start: before, end: after, event });
			}
		};

		const handleKeyDown = (event) => {
			const key = keyFromEvent(event);

			if (key === 'ArrowRight' || key === 'ArrowUp') return applyStep(1, event);
			if (key === 'ArrowLeft' || key === 'ArrowDown') return applyStep(-1, event);

			const before = value.get();

			if (disabled.get() || value.isImmutable()) return;

			const mn = safeMin.get();
			const mx = safeMax.get();
			if (!Number.isFinite(mn) || !Number.isFinite(mx) || mx === mn) return;

			let st = parseFloat(step.get() || 1);
			if (!Number.isFinite(st) || st <= 0) st = 1;

			let v = parseFloat(value.get());
			if (!Number.isFinite(v)) v = mn;

			let next = null;
			if (key === 'PageUp') next = v + st * 10;
			else if (key === 'PageDown') next = v - st * 10;
			else if (key === 'Home') next = mn;
			else if (key === 'End') next = mx;
			else return;

			event.preventDefault();
			event.stopPropagation();

			focused.set(true);
			value.set(normalize(next, mn, mx, st));

			const after = value.get();
			if (before !== after) {
				fire('slideKey', { key, start: before, end: after, event });
			}
		};

		return <div
			ref={rootRef}
			tabIndex={disabled.map(d => d ? -1 : 0)}
			role="slider"
			aria-orientation={isVertical.map(v => v ? 'vertical' : 'horizontal')}
			aria-disabled={disabled}
			aria-valuemin={safeMin}
			aria-valuemax={safeMax}
			aria-valuenow={value}
			onMouseLeave={() => focused.set(false)}
			onPointerDown={(event) => {
				if (disabled.get()) return;
				if (value.isImmutable()) return;
				if (event.button !== undefined && event.button !== 0) return;

				dragStartValue.set(value.get());
				fire('slideStart', { start: value.get(), event });

				focused.set(true);
				rootRef.get()?.focus?.();

				dragging.set(true);
				setFromEvent(event);

				const el = rootRef.get();
				if (el?.setPointerCapture) {
					try { el.setPointerCapture(event.pointerId); } catch { }
					return;
				}

				const move = (e) => setFromEvent(e);
				const up = () => stopDrag();

				window.addEventListener('pointermove', move);
				window.addEventListener('pointerup', up, { once: true });
				window.addEventListener('pointercancel', up, { once: true });

				stopWindowDrag.fn = () => window.removeEventListener('pointermove', move);
			}}
			onPointerMove={(event) => {
				if (!dragging.get()) return;
				setFromEvent(event);
			}}
			onPointerUp={() => stopDrag()}
			onPointerCancel={() => stopDrag()}
			onKeyDown={handleKeyDown}
			style={style}
			{...props}
			theme={[
				'slider',
				isVertical.map(v => v ? 'vertical' : 'horizontal'),
				expand.map(e => e ? 'expand' : null),
				disabled.bool('disabled', null),
			]}
		>
			<div ref={railRef} theme={['sliderrail']}>
				<span
					style={styleTrack}
					theme={[
						'slidertrack',
						isVertical.map(v => v ? 'vertical' : null),
						hover.bool('hovered', null),
						disabled.bool('disabled', null),
						Observer.all([disabled, focused]).map(([d, f]) => !d && f ? 'focused' : null),
					]}
				>
					<span
						style={{
							display: cover.map(c => c ? null : 'none'),
							width: Observer.all([isVertical, percent]).map(([v, p]) => v ? '100%' : `${p * 100}%`),
							height: Observer.all([isVertical, percent]).map(([v, p]) => v ? `${p * 100}%` : '100%'),
						}}
						theme={[
							'slidercover',
							isVertical.map(v => v ? 'vertical' : null),
							hover.bool('hovered', null),
							disabled.bool('disabled', null),
						]}
					/>
					{children}
				</span>

				<span
					style={{
						...styleThumb,
						left: Observer.all([isVertical, percent]).map(([v, p]) => v ? null : `${p * 100}%`),
						top: Observer.all([isVertical, percent]).map(([v, p]) => v ? `${(1 - p) * 100}%` : null),
					}}
					theme={[
						'sliderthumb',
						isVertical.map(v => v ? 'vertical' : null),
						hover.bool('hovered', null),
						disabled.bool('disabled', null),
						Observer.all([disabled, focused]).map(([d, f]) => !d && f ? 'focused' : null),
					]}
				/>
			</div>
		</div>;
	};

	return Slider;
}));
