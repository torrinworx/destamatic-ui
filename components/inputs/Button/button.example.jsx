import { Observer } from 'destam';
import { mount } from 'destam-dom';
import { Button } from 'destamatic-ui';

const Example = ({ }, cleanup) => {
	const onClick = () => console.log("Hello World!");

	const doneCheck = Observer.mutable(false);

	cleanup(doneCheck.watch(() => {
		if (doneCheck.get()) {
			setTimeout(() => {
				doneCheck.set(false);
			}, 1200);
		}
	}));

	return <div theme='column_center' style={{ padding: 10, gap: 10 }}>
		<Button type='contained' label='Contained' onClick={onClick} />
		<Button type='outlined' label='Outlined' onClick={onClick} />
		<Button type='text' label='Text' onClick={onClick} />
		<Button
			type='outlined'
			iconPosition='right'
			label={doneCheck.map(c => c ? 'Done!' : 'Promise')}
			onClick={async () => new Promise(ok => setTimeout(() => {
				doneCheck.set(true); ok();
			}, 1000))}
		/>
		<Button type='contained' label='Disabled' disabled />
	</div>;
};

mount(root, <Example />);
