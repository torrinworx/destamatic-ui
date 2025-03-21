import { Observer, mount } from 'destam-dom';
import { Select, popups, Typography } from 'destamatic-ui';

const input = Observer.mutable('');

mount(document.body, <>
	<div style={{display: 'flex', alignItems: 'center', justifyContent: 'center', inset: 0, position: 'absolute', flexDirection: 'column'}}>
		<Typography label={input} />
		<Select options={['one', 'two', 'three']} style={{width: '100px'}} type="contained" value={Observer.mutable('one')} />
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
