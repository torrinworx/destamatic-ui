import Observer from 'destam/Observer';

import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

export default ThemeContext.use(h => {
	const TextField = ({
		value,
		type = 'text',
		inline,
		expand,
		onEnter,
		error,
		focused = false,
		...props
	}, cleanup, mounted) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(error instanceof Observer)) error = Observer.immutable(error);
		if (!(expand instanceof Observer)) expand = Observer.immutable(expand);
		if (!(focused instanceof Observer)) focused = Observer.mutable(focused);

		const ref = Observer.mutable(null);

		mounted(() => cleanup(focused.effect(e => {
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
			isFocused={focused}
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
				focused.map(e => e ? 'focused' : null),
				error.map(e => e ? 'error' : null),
				expand.map(e => e ? 'expand' : null),
			]}
		/>;
	};

	return TextField;
});
