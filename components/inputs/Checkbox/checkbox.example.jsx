import { Observer } from 'destam';
import { mount } from 'destam-dom';
import { Checkbox, Typography } from 'destamatic-ui';

const Example = () => {
	const checkboxCount = Observer.mutable(0);

	return <div theme='column_center'>
		<Typography
			type='p1'
			label={checkboxCount.map(c => `Boxes checked: ${c}`)}
		/>

		<div theme='row'>
			{Array.from({ length: 10 }).map(() => Observer.mutable(false)).map(box =>
				<Checkbox
					value={box}
					onChange={val => {
						if (val) {
							checkboxCount.set(checkboxCount.get() + 1);
							setTimeout(() => {
								if (box.get()) {
									box.set(false);
									checkboxCount.set(checkboxCount.get() - 1);
								}
							}, 2500);
						} else {
							checkboxCount.set(checkboxCount.get() - 1);
						}
					}}
				/>
			)}
		</div>
	</div>
};

mount(root, <Example />);
