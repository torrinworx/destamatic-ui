import { Observer, mount } from 'destam-dom';
import { TextField } from 'destamatic-ui';

const input = Observer.mutable('');

mount(document.body, <>
	<TextField value={input} />
	<TextField value={input} />
	<TextField value={Observer.immutable("you cannot change this text")} />
</>);