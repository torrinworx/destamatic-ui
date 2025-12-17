import { Observer } from 'destam';
import { mount } from 'destam-dom';
import { Checkbox } from 'destamatic-ui';

const Example = () => {
	const checked = Observer.mutable(false);

	return <div theme='column_center'>
		{checked.map(c => `Checked: ${c}`)}

		<div theme='row'>
			<Checkbox value={checked} />
		</div>
	</div>
};

mount(root, <Example />);
