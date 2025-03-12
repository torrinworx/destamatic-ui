import { mount, Observer } from 'destam-dom';
import { Radio } from 'destamatic-ui';

const sel = Observer.mutable(0);
const SelectRadio = Radio(sel);

mount(document.body, <div style={{ display: 'flex', flexDirection: 'column', gap: 20, margin: 10 }}>
	<SelectRadio value={0} label="One" />
	<SelectRadio value={1} label="Two" />
	<SelectRadio value={2} label="Three" />
	{/* No label */}
	<SelectRadio value={3} />
	<SelectRadio value={4} label="Red" style={{ color: 'red' }} />
	<SelectRadio value={5} label="Red, Blue Background" style={{ color: 'red', background: 'blue' }} />
</div>);
