import { Observer } from 'destam-dom';

import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	field_area: {
		resize: 'none',
		overflowY: 'auto',
	},
});

export default ThemeContext.use(h => {
	/**
	 * Textarea component that provides a flexible and controllable text input area.
	 * Automatically resizes based on the content up to a maximum height.
	 *
	 * @param {Object} props - The properties object.
	 * @param {JSX.Element | string} [props.children] - Children elements to be included inside the textarea.
	 * @param {Observer<string>} [props.value] - Observable value for the textarea content.
	 * @param {Object} [props.style] - Custom styles to apply to the textarea.
	 * @param {number} [props.maxHeight=200] - Maximum height of the textarea before it starts to scroll.
	 * @param {Function} [props.onKeyDown] - Function to call when a key is pressed down inside the textarea.
	 * @param {string} [props.placeholder] - Placeholder text for the textarea.
	 * @param {...Object} [props] - Additional properties to spread onto the textarea element.
	 * @param {boolean} isMounted - Observer to track if the component is mounted.
	 * @param {boolean} isFocused - Observer to track if the textarea is focused.
	 *
	 * @returns {JSX.Element} The rendered textarea element.
	 */
	const Textarea = Theme.use(themer => (
		{
			children,
			value,
			style,
			maxHeight = 200,
			onKeyDown,
			placeholder = '',
			error,
			theme,
			type,
			autofocus,
			...props
		},
		_,
		mounted
	) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(error instanceof Observer)) error = Observer.immutable(error);

		const Ref = <raw:textarea />;
		const isMounted = Observer.mutable(false);
		const isFocused = Observer.mutable(false);

		// TODO: Figure out why the microtask is needed. Sometimes without it,
		// the text area won't have the right initial size.
		mounted(() => queueMicrotask(() => isMounted.set(true)));

		if (autofocus) mounted(() => Ref.focus());

		const _class = themer(
			theme,
			'field',
			'area',
			type,
			isFocused.map(e => e ? 'focused' : null),
			error.map(e => e ? 'error' : null));

		return <Ref
			class={_class}
			placeholder={placeholder}
			$value={value}
			onKeyDown={onKeyDown}
			onInput={e => {
				if (value.isImmutable()) {
					Ref.value = value.get() || '';
					return;
				}

				value.set(e.target.value);
			}}
			isFocused={isFocused}
			style={{
				height: isMounted.map(mounted => {
					if (!mounted) return 'auto';

					return value.map(val => {
						const elem = <raw:textarea class={_class.get()} rows={1} $value={val} $style={{
							width: Ref.clientWidth + 'px',
						}} />;

						document.body.appendChild(elem);
						let calculatedHeight = elem.scrollHeight + 1;
						document.body.removeChild(elem);

						if (calculatedHeight > maxHeight) calculatedHeight = maxHeight;

						return calculatedHeight + 'px';
					}).memo();
				}).unwrap(),
				...style
			}}
			{...props}
		/>;
	});

	return Textarea;
});
