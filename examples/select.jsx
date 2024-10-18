import { Observer, mount } from 'destam-dom';
import { Select, popups, Typography, KebabMenu, Paper } from 'destamatic-ui';

const input = Observer.mutable('');

mount(document.body, <>
	<Typography style={{display: 'flex', alignItems: 'center', justifyContent: 'center', inset: 0, position: 'absolute'}}>
		{input}
	</Typography>
	{[
		['left', 'top'],
		['right', 'top'],
		['left', 'bottom'],
		['right', 'bottom'],
	].map(([a, b]) => {
		return <Select style={{position: 'absolute', [a]: 0, [b]: 0}} value={input} options={Array(100).fill(null).map((_, i) => i)} />
	})}

	<KebabMenu style={{position: 'absolute', left: 100, top: 100}} items={[
		{label: 'Rename'},
		{label: 'Remove'},
	]} />
	{popups}
</>);
