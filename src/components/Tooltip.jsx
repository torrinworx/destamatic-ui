import h from './h';

import Shown from './Shown';
import Popup from './Popup';
import Theme from './Theme';
import Button from './Button';

const Tooltip = ({hover=Observer.mutable(''), label, ...style}) => {
	if (!(hover instanceof Observer)) hover = Observer.mutable(hover);

	return <Shown value={hover}>
		<Popup placement={hover}>
			<div style={{
				background: 'white',
				borderRadius: Theme.borderRadius,
				border: `1px solid ${Theme.Colours.secondary.base}`,
				fontColor: Theme.Colours.primary.base,
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
};

export default Tooltip;