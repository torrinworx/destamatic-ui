import Observer from 'destam/Observer';

import Theme from '../../utils/Theme/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

Theme.define({
    field_area: {
        resize: 'none',
        overflowY: 'auto',
    },
});

export default ThemeContext.use(h => {
    const TextArea = ({
        value,
        type = 'text',
        style,
        inline,
        expand,
        onEnter,
        error,
        focused,
        disabled,
        hover,
        maxHeight = 200,
        onKeyDown,
        ...props
    }, cleanup, mounted) => {
        if (!(value instanceof Observer)) value = Observer.immutable(value);
        if (!(error instanceof Observer)) error = Observer.immutable(error);
        if (!(expand instanceof Observer)) expand = Observer.immutable(expand);
        if (!(focused instanceof Observer)) focused = Observer.mutable(focused);
        if (!(hover instanceof Observer)) hover = Observer.mutable(hover);
        if (!(disabled instanceof Observer)) disabled = Observer.mutable(disabled);
        if (!(maxHeight instanceof Observer)) maxHeight = Observer.immutable(maxHeight);

        const ref = Observer.mutable(null);

        const height = Observer.mutable('auto');
        const overflowY = Observer.mutable('hidden');

        const measurer = { el: null };

        const parseMax = (v) => {
            const n = parseFloat(v);
            return Number.isFinite(n) && n > 0 ? n : null;
        };

        const resize = () => {
            const el = ref.get();
            const m = measurer.el;
            if (!el || !m) return;

            // Let theme-generated classes do the styling work
            m.className = el.className;

            const w = el.getBoundingClientRect().width || el.clientWidth || 0;
            m.style.width = Math.max(1, w) + 'px';

            // Use DOM value best)(, fallback to observer
            m.value = el.value ?? (value.get() || '');

            m.style.height = 'auto';
            const natural = (m.scrollHeight || 0) + 1;

            const maxH = parseMax(maxHeight.get());
            const clamped = maxH != null ? Math.min(natural, maxH) : natural;

            height.set(clamped + 'px');
            overflowY.set(maxH != null && natural > maxH ? 'auto' : 'hidden');
        };

        mounted(() => {
            // Create a single hidden textarea measurer
            const m = document.createElement('textarea');
            m.setAttribute('aria-hidden', 'true');
            m.tabIndex = -1;
            m.rows = 1;

            // Hide it once (not copied every time)
            m.style.position = 'absolute';
            m.style.top = '0';
            m.style.left = '-9999px';
            m.style.visibility = 'hidden';
            m.style.pointerEvents = 'none';
            m.style.height = '0';
            m.style.overflow = 'hidden';

            document.body.appendChild(m);
            measurer.el = m;

            cleanup(() => m.remove());

            // initial measure after layout settles
            queueMicrotask(resize);

            // remeasure when value/maxHeight changes programmatically
            cleanup(value.watch(() => queueMicrotask(resize)));
            cleanup(maxHeight.watch(() => queueMicrotask(resize)));

            // remeasure on width changes (material-ish behavior)
            const el = ref.get();
            if (el && window.ResizeObserver) {
                const ro = new ResizeObserver(() => resize());
                ro.observe(el);
                cleanup(() => ro.disconnect());
            }
        });

        mounted(() => cleanup(focused.effect(f => {
            const el = ref.get();
            if (!el) return;
            if (f) el.focus();
            else el.blur();
        })));

        if (!focused.isImmutable()) props.isFocused = focused;
        if (!hover.isImmutable()) props.isHovered = hover;

        return <textarea
            ref={ref}
            rows={1}
            $value={value.def('')}
            onInput={e => {
                if (disabled.get()) return;

                if (value.isImmutable()) {
                    const el = ref.get();
                    const v = value.get() || '';
                    if (el && el.value !== v) el.value = v;
                    resize();
                    return;
                }

                value.set(e.target.value);
                resize();
            }}
            onKeyDown={e => {
                if (disabled.get()) return;

                if (value.isImmutable()) e.preventDefault();

                if (onKeyDown) onKeyDown(e);
                if (e.key === 'Enter' && onEnter) onEnter(e);
            }}
            isFocused={focused}
            style={{
                height,
                overflowY,
                display: inline ? 'inline-flex' : 'flex',
                ...style,
            }}
            disabled={disabled}
            {...props}
            theme={[
                'field',
                'area',
                type,
                focused.map(v => v ? 'focused' : null),
                error.map(v => v ? 'error' : null),
                expand.map(v => v ? 'expand' : null),
                hover.bool('hovered', null),
                disabled.bool('disabled', null),
            ]}
        />;
    };

    return TextArea;
});