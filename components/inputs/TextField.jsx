import ThemeContext from '../utils/ThemeContext';
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
		Ref = <raw:input />,
		...props
	}, cleanup) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(error instanceof Observer)) error = Observer.immutable(error);
		if (!(expand instanceof Observer)) expand = Observer.immutable(expand);
		if (!(focus instanceof Observer)) focus = Observer.mutable(focus);

		cleanup(focus.effect(e => {
			if (e) Ref.focus();
			else Ref.blur();
		}));

		return <Ref
			$value={value.def('')}
			onInput={(e) => {
				if (value.isImmutable()) {
					Ref.value = value.get() || '';
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
