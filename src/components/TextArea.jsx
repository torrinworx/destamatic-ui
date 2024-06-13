import { h, Observer } from 'destam-dom';

import Theme from './Theme';
import Popup from './Popup';
import Shown from './Shown';
import Button from './Button';

const Textarea = ({children, value, style, maxHeight = 200, id, onKeyDown, placeholder, suggestions, ...props}, _, mounted) => {
	if (!value) value = Observer.mutable('');

	const Ref = <textarea />;
	const isMounted = Observer.mutable(false);
	const isFocused = Observer.mutable(false)
	mounted(() => isMounted.set(true));

	const autocomplete = Observer.mutable({matches: [], bottom: 0, left: 0})

	const checkMatches = () => {
		// Get current value and cursor(caret) position
		const cursorPos = Ref.selectionStart;
		const text = value.get()
	
		// Iterate backwards through characters until we find a space or newline character
		let startIndex = cursorPos - 1;
		while (startIndex >= 0 && !/\s/.test(text[startIndex])) {
			startIndex--;
		}
		
		const currentWord = text.substring(startIndex + 1, cursorPos)
		if (!currentWord) return

		// Filter out suggestions that could be possible
		const matches = suggestions.filter(suggestion => suggestion.startsWith(currentWord))
		
		// Dummy element to mimic location of text cursor
		let elem = <div $style={{
			resize: 'none',
			paddingTop: '0px',
			paddingBottom: '0px',
			boxSizing: 'border-box',
			width: Ref.clientWidth + 'px',
			fontSize: '14px',
			fontFamily: 'monospace',
		}} />;

		const pre = document.createTextNode(value.get().slice(0, startIndex + 1));
		const caretEle = document.createElement('span');
		caretEle.innerHTML = '&nbsp;';

		elem.append(pre, caretEle);

		document.body.appendChild(elem);
		const {top, left} = caretEle.getBoundingClientRect();
		document.body.removeChild(elem);

		const ref = Ref.getBoundingClientRect()

		autocomplete.set({matches, bottom: window.innerHeight - (top + ref.top), left: left + ref.left, top: null })
	};

	if (suggestions?.length) value.watch(() => checkMatches())

	autocompleteMatch = (match) => {
		// Get current value and cursor(caret) position
		const cursorPos = Ref.selectionStart;
		const text = value.get()
	
		// Iterate backwards through characters until we find a space or newline character
		let startIndex = cursorPos - 1;
		while (startIndex >= 0 && !/\s/.test(text[startIndex])) {
			startIndex--;
		}

		value.set(text.slice(0, startIndex + 1) + match + text.slice(cursorPos))
		autocomplete.set({matches: [], bottom: 0, left: 0})
	}
	
	const Suggestion = ({each: match}) => {
		return <Button onClick={() => autocompleteMatch(match)} label={match}/>
	} 

	return <div $style={{ width: '100%' }}>
		<Ref
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
				width: '100%',
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
		/>
		<Shown value={autocomplete.map(match => match.matches.length)}>
			<Popup placement={autocomplete}>
				<div $style={{
                        background: 'white',
                        borderRadius: Theme.borderRadius,
                        border: `1px solid ${Theme.colours.secondary.base}`,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
						fontFamily: 'Roboto, sans-serif'
                    }}>
					<Suggestion each={autocomplete.map(match => match.matches)} />
				</div>
			</Popup>
		</Shown>
	</div>;
};

export default Textarea;
