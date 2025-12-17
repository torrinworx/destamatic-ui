import { mount } from 'destam-dom';
import { Button } from 'destamatic-ui';

const Example = () => {
	const onClick = () => console.log("Hello World!");

	return <div theme='column_center' style={{ padding: 10, gap: 10 }}>
		<Button type='contained' label='Contained' onClick={onClick} />
		<Button type='outlined' label='Outlined' onClick={onClick} />
		<Button type='text' label='Text' onClick={onClick} />
		<Button type='contained' label='Disabled' disabled onClick={onClick} />
	</div>;
};

mount(root, <Example />);
