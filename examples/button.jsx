import { mount } from 'destam-dom';
import { Button } from 'destamatic-ui';

mount(document.body, <>
	<Button label="hello" type='contained' onClick={() => {}} />
	<Button label="world" type='outlined' onClick={() => {}} />
</>);
