import { h, Observer } from 'destam-dom';

import Theme from './Theme';

const Textarea = (
	{ 
		children,
		value,
		style,
		maxHeight = 200,
		id,
		onKeyDown,
		placeholder,
		...props
	},
	_,
	mounted
) => {
	if (!value) value = Observer.mutable('');

	const Ref = <textarea />;
	const isMounted = Observer.mutable(false);
	const isFocused = Observer.mutable(false)
	mounted(() => isMounted.set(true));

	return <Ref
		$id={id}
		$placeholder={placeholder}
		$value={value}
		$onkeydown={onKeyDown}
		$oninput={e => value.set(e.target.value)}
		$onfocus={() => isFocused.set(true)}
		$onblur={() => isFocused.set(false)}
		$style={{
			resize: 'none',
			overflowY: 'auto',
			flexGrow: 1,
			height: Theme.height,
			padding: Theme.padding,
			borderRadius: Theme.borderRadius,
			border: `${Theme.outline} ${Theme.colours.secondary.base}`,
			fontSize: '14px',
			outline: isFocused.map(f => f ? `${Theme.outline} ${Theme.colours.primary.base}` : null),
			height: isMounted.map(mounted => {
				if (!mounted) return 'auto';

				return value.map(val => {
					let elem = <textarea rows={1} $value={val} $style={{
						resize: 'none',
						paddingTop: '0px',
						paddingBottom: '0px',
						boxSizing: 'border-box',
						width: Ref.clientWidth + 'px'
					}} />;

					document.body.appendChild(elem);
					let calculatedHeight = elem.scrollHeight;
					document.body.removeChild(elem);

					if (calculatedHeight > maxHeight) {
						calculatedHeight = maxHeight;
					}

					return calculatedHeight + 'px';
				}).memo();
			}).unwrap(),
			...style
		}}
		{...props}
	/>;
};

export default Textarea;
