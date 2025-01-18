import { Tooltip, popups } from 'destamatic-ui';
import { mount, OArray, Observer } from 'destam-dom';

mount(document.body, <>
	<div theme="center" style={{inset: 0}}>
		<Tooltip label="This is a tooltip">
			<div>This is some text</div>
		</Tooltip>
	</div>
	{popups}
</>);
