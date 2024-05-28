import { h, Observer } from 'destam-dom';

import { borderRadius, height, padding, colours, outline } from './Theme';

const Textarea = ({value, style, maxHeight = 200, id, onkeydown, placeholder, ...props}, _, mounted) => {
	const Ref = <textarea />;
	const isMounted = Observer.mutable(false);
	const isFocused = Observer.mutable(false)
	mounted(() => isMounted.set(true));

	return <Ref
		$id={id}
		$placeholder={placeholder}
		$value={value}
		$onkeydown={onkeydown}
		$oninput={e => value.set(e.target.value)}
		$onfocus={() => isFocused.set(true)}
		$onblur={() => isFocused.set(false)}
		$style={{
			resize: 'none',
			overflowY: 'auto',
			flexGrow: 1,
			height: height,
			padding: padding,
			borderRadius: borderRadius,
			border: `${outline} ${colours.secondary.base}`,
			fontSize: '14px',
			...style,
			outline: isFocused.map(f => f ? `${outline} ${colours.primary.base}` : null),
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
		}}
		{...props}
	/>;
};

export default Textarea;
