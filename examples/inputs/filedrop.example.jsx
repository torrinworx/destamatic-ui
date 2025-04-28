import { mount, Observer } from 'destam-dom';
import { FileDrop, Icons } from 'destamatic-ui';

import FeatherIcons from 'destamatic-ui/components/icons/FeatherIcons';

mount(document.body, <>
	<Icons value={FeatherIcons}>
		<FileDrop />
	</Icons>
</>);
