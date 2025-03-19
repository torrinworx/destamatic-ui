import { mount, Observer} from 'destam-dom';
import { Checkbox } from 'destamatic-ui';

const value = Observer.mutable(false);

mount(document.body, <>
	<Checkbox each:value={[
		value,
		value.map(v => !v, v => !v),
	]} />
</>);
