import FocusEffect from './FocusEffect';
import Observer from 'destam/Observer';
import { h } from './h';

// Takes value as an observer
const TextField = ({ value, style, type = 'text', inline, expand, onEnter, error, autoselect, onFocus, ...props }) => {
	if (!(value instanceof Observer)) value = Observer.immutable(value);
	expand = Observer.immutable(expand);

	const focus = Observer.mutable(false);
	const Input = <input />;

	return <FocusEffect
		enabled={focus.map(focus => focus && !value.isImmutable())}
		error={error}
		onMouseDown={e => {
			if (e.target !== Input)  {
				Input.focus();
				e.preventDefault();
			}
		}}
		style={{
			flexGrow: expand.map(e => e ? 1 : ''),
			height: expand.map(e => e ? '100%' : 'auto'),
			display: inline ? 'inline-flex' : 'flex',
			cursor: 'text',
			...style
		}}
	>
		<Input
			$value={value.def('')}
			theme='text_field'
			onInput={(e) => {
				if (value.isImmutable()) {
					Input.value = value.get() || '';
					return;
				}
				value.set(e.target.value);
			}}
			type={type}
			isFocused={focus}
			style={{
				height: '100%',
			}}
			onKeyDown={e => {
				if (e.key === 'Enter') {
					if (onEnter) {
						onEnter(e);
						e.preventDefault();
					}
				}
			}}
			{...props}
		/>
	</FocusEffect>;
};

export default TextField;
