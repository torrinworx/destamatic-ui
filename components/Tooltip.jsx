import { h } from './h';

import { Observer } from 'destam-dom';

import Shown from './Shown';
import Popup from './Popup';
import Theme from './Theme';
import Button from './Button';

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
