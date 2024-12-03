import { h } from '../utils/h';

import { Observer } from 'destam-dom';

import Shown from '../utils/Shown';
import Popup from '../utils/Popup';
import Theme from '../utils/Theme';
import Button from '../inputs/Button';

Theme.define({
	tooltip: {
		extends: ['primary', 'radius'],

		background: 'white',
		border: `1px solid $color`,
		fontColor: '$color',
		display: 'flex',
		flexDirection: 'column',
		alignItems: 'center',
		opacity: '80%',
	}
});

const Tooltip = ({hover, label, ...style}) => {
	if (!(hover instanceof Observer)) hover = Observer.mutable(hover);

	return <Shown value={hover}>
		<Popup placement={hover}>
			<div theme="tooltip" style={style}>
				<Button label={label} style={{ color: 'grey' }}/>
			</div>
		</Popup>
	</Shown>;
};

export default Tooltip;
