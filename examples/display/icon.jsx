import { mount, Observer } from 'destam-dom';
import { FeatherIcons, MaterialIcons, Icon, Icons } from 'destamatic-ui';

const icons = {
	feather: FeatherIcons('feather'),
	logo: MaterialIcons('filled:logo_dev')
};

const size = Observer.timer(500).map(t => t % 2 === 0 ? 25 : 100)
const name = Observer.timer(500).map(t => t % 2 === 0 ? 'logo' : 'feather')
mount(document.body, <>
	<Icons value={icons}>
		<div theme='row'>
			{/* Reactive name with styles */}
			<Icon name={name} size={48} style={{ color: 'red', fill: 'blue' }}
			/>
			{/* Color */}
			<Icon name='feather' size={48} style={{ color: 'red' }} />

			{/* Stroke */}
			<Icon name='feather' size={48} style={{ stroke: 'blue' }} />

			{/* Fill */}
			<Icon name='logo' size={48} style={{ fill: 'green' }} />
		</div>
		<div theme='row' >
			{/* Reactive size */}
			<Icon name='feather' size={size} style={{ color: 'red' }} />
			<Icon name='feather' size={size} style={{ stroke: 'blue' }} />
			<Icon name='logo' size={size} style={{ fill: 'green' }} />
		</div>
	</Icons>
	<Icons value={FeatherIcons}>
		<Icons value={{

		}}>
			<Icon name='feather' size={48} style={{ stroke: 'blue' }} />
		</Icons>
	</Icons>
</>);
