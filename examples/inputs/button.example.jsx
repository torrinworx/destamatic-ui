import { mount } from 'destam-dom';
import { Button, Typography } from 'destamatic-ui';

mount(document.body, <>
	<Button label="hello" type='contained' onClick={() => { }} />
	<Button label="world" type='outlined' onClick={() => { }} />
	<Button label={<Typography type='h1' label='hello world' />} type='outlined' onClick={() => { }} />

</>);
