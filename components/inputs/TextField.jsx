import ThemeContext from '../utils/ThemeContext.jsx';
import Observer from 'destam/Observer';

export default ThemeContext.use(h => {
	const TextField = ({
		value,
		type = 'text',
		inline,
		expand,
		onEnter,
		error,
		focus = false,
		...props
	}, cleanup, mounted) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(error instanceof Observer)) error = Observer.immutable(error);
		if (!(expand instanceof Observer)) expand = Observer.immutable(expand);
		if (!(focus instanceof Observer)) focus = Observer.mutable(focus);

		const ref = Observer.mutable(null);

		mounted(() => cleanup(focus.effect(e => {
			if (e) ref.get().focus();
			else ref.get().blur();
		})));

		return <input ref={ref}
			$value={value.def('')}
			onInput={(e) => {
				if (value.isImmutable()) {
					ref.get().value = value.get() || '';
					return;
				}
				value.set(e.target.value);
			}}
			type={type}
			isFocused={focus}
			onKeyDown={e => {
				if (value.isImmutable()) {
					e.preventDefault();
				}

				if (e.key === 'Enter') {
					if (onEnter) {
						onEnter(e);
						e.preventDefault();
					}
				}
			}}
			{...props}
			theme={[
				'field',
				'line',
				focus.map(e => e ? 'focused' : null),
				error.map(e => e ? 'error' : null),
				expand.map(e => e ? 'expand' : null),
			]}
		/>;
	};

	return TextField;
});
