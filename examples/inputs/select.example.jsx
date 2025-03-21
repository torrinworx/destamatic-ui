import { Observer, mount } from 'destam-dom';
import { Select, popups, Typography } from 'destamatic-ui';

const input = Observer.mutable('');

mount(document.body, <>
	<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', inset: 0, position: 'absolute', flexDirection: 'column'}}>
		<Typography label={input} />
		<Select options={['one', 'two', 'three']} style={{width: '100px'}} type="contained" value={Observer.mutable('one')} />
		<Select options={Array(70).fill(null).map((_, i) => String.fromCharCode(i + 41))} style={{width: '100px'}} type="contained" value={Observer.mutable('a')} />
	</div>
	{[
		['left', 'top'],
		['right', 'top'],
		['left', 'bottom'],
		['right', 'bottom'],
	].map(([a, b]) => {
		return <Select style={{position: 'absolute', [a]: 0, [b]: 0}} value={input} options={Array(100).fill(null).map((_, i) => i)} />
	})}

	{popups}
</>);
