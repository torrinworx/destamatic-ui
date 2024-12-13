import { Scroll, Button } from 'destamatic-ui';
import { Observer, mount } from 'destam-dom';

const width = Observer.mutable(100);
const height = Observer.mutable(100);

mount(document.body, <>
	<div theme="center" style={{position: 'absolute', inset: 0}}>
		<Scroll style={{width: 500, height: 500}}>
			<div style={{
				width,
				height,
				background: 'linear-gradient(to bottom right, red, green)'
			}} />
		</Scroll>
	</div>
	<Button onClick={() => width.set(width.get() + 200)}>Expand right</Button>
	<Button onClick={() => height.set(height.get() + 200)}>Expand down</Button>
</>);
