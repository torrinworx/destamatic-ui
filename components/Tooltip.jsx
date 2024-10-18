import { h } from './h';

import { Observer } from 'destam-dom';

import Shown from './Shown';
import Popup from './Popup';
import Theme from './Theme';
import Button from './Button';

const Tooltip = Theme.use(theme => ({hover=Observer.mutable(''), label, ...style}) => {
	if (!(hover instanceof Observer)) hover = Observer.mutable(hover);

	return <Shown value={hover}>
		<Popup placement={hover}>
			<div style={{
				background: 'white',
				borderRadius: theme.borderRadius,
				border: `1px solid ${theme.Colours.secondary.base}`,
				fontColor: theme.Colours.primary.base,
				display: 'flex',
				flexDirection: 'column',
				alignItems: 'center',
				opacity: '80%',
				...style
			}}>
				<Button label={label} style={{ color: 'grey' }}/>
			</div>
		</Popup>
	</Shown>;
});

export default Tooltip;
