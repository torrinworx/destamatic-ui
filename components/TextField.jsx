import Observer from 'destam/Observer';
import { h } from './h';

// Takes value as an observer
const TextField = ({ value, style, type = 'text', inline, expand, onEnter, error, autoselect, onFocus, ...props }) => {
	if (!(value instanceof Observer)) value = Observer.immutable(value);
	if (!(error instanceof Observer)) error = Observer.immutable(error);
	expand = Observer.immutable(expand);

	const focus = Observer.mutable(false);
	const Input = <input />;

	return <Input
		$value={value.def('')}
		theme={[
			'text', 'field',
	        focus.map(e => e ? 'focused' : null),
	        error.map(e => e ? 'error' : null),
	        expand.map(e => e ? 'expand' : null),
		]}
		style={style}
		onInput={(e) => {
			if (value.isImmutable()) {
				Input.value = value.get() || '';
				return;
			}
			value.set(e.target.value);
		}}
		type={type}
		isFocused={focus}
		onKeyDown={e => {
			if (e.key === 'Enter') {
				if (onEnter) {
					onEnter(e);
					e.preventDefault();
				}
			}
		}}
		{...props}
	/>;
};

export default TextField;
