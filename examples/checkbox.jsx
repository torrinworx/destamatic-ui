import { mount, Observer} from 'destam-dom';
import { Checkbox } from 'destamatic-ui';

const value = Observer.mutable(false);

mount(document.body, <>
	<Checkbox value={value} />
	<Checkbox value={value.map(v => !v)} />
</>);
