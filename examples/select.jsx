import { Observer, mount } from 'destam-dom';
import Select from 'destamatic-ui/Select';
import {popups} from 'destamatic-ui/Popup';
import Typography from 'destamatic-ui/Typography';
import KebabMenu from 'destamatic-ui/KebabMenu';
import Paper from 'destamatic-ui/Paper';

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
