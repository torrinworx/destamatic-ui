import { mount } from 'destam-dom';
import { Typography } from 'destamatic-ui';

const Example = () => {

	return <Typography type='h1' label='hello world!' />
}

mount(root, <Example />);
