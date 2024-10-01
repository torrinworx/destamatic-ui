import FocusEffect from './FocusEffect';
import Observer from 'destam/Observer';
import {h} from './h';

// Takes value as an observer
const TextField = ({value, style, type = 'text', inline, expand, onEnter, error, autoselect, onFocus, ...props}) => {
	if (!(value instanceof Observer)) value = Observer.immutable(value);
	expand = Observer.immutable(expand);

	const focus = Observer.mutable(false);
	const Input = <input />;

	return <FocusEffect
		enabled={focus.map(focus => focus && !value.isImmutable())}
		error={error}
		onMouseDown={e => {
			Input.focus();

			if (e.target !== Input)  {
				e.preventDefault();
			}
		}}
		style={{
			flexGrow: expand.map(e => e ? 1 : ''),
			height: expand.map(e => e ? '100%' : 'auto'),
			display: inline ? 'inline-flex' : 'flex',
			alignItems: 'center',
			padding: 10,
			marginTop: 10,
			marginBottom: 10,
			pointer: 'text',
			background: 'white',
			...style
		}}
	>
		<Input
			$value={value.def('')}
			onInput={(e) => {
				if (value.isImmutable()) {
					Input.value = value.get() || '';
					return;
				}

				value.set(e.target.value);
			}}
			type={type}
			onFocus={() => {
				if (autoselect) Input.select();
				if (onFocus) onFocus();

				focus.set(true);
			}}
			onBlur={() => focus.set(false)}
			style={{
				border: 0,
				outline: 0,
				padding: 0,
				fontSize: '1rem',
				width: '100%',
				height: '100%',
				background: 'none',
			}}
			onKeyDown = {e => {
				if (e.key === 'Enter'){
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
