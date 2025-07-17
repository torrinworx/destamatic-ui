import { Observer, mount } from 'destam-dom';
import { Select, Typography, PopupContext, Popup } from 'destamatic-ui';

const input = Observer.mutable('');

const options = {
	'option 1': () => {
		window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_self');
	},
	'option 1': () => {
		window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_self');
	},
	'option 1': () => {
		window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_self');
	},
	'option 1': () => {
		window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_self');
	},
};

mount(document.body, <PopupContext>
	<div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', inset: 0, position: 'absolute', flexDirection: 'column' }}>
		<Typography label={input} />
		<Select options={['one', 'two', 'three']} style={{ width: '100px' }} type="contained" value={Observer.mutable('one')} />
		<Select options={Array(70).fill(null).map((_, i) => String.fromCharCode(i + 41))} style={{ width: '100px' }} type="contained" value={Observer.mutable('a')} />
	</div>
	{[
		['left', 'top'],
		['right', 'top'],
		['left', 'bottom'],
		['right', 'bottom'],
	].map(([a, b]) => {
		return <Select style={{ position: 'absolute', [a]: 0, [b]: 0 }} value={input} options={Array(100).fill(null).map((_, i) => i)} />
	})}

	{/* You can use select to create a static dropdown with each button running a function, not just a selectable list */}
	<Select
		placeholder='Functions'
		options={Object.keys(options)}
		value={Observer.immutable().setter(key => options[key]())}
		style={{ width: 150, border: 'none' }}
		type='text'
	/>

	<Popup />
</PopupContext>);
