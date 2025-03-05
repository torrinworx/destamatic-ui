import { mount, Observer } from 'destam-dom';
import { FeatherIcons, MaterialIcons, Icon, Icons } from 'destamatic-ui';

const icons = {
	feather: FeatherIcons('feather'),
	logo: MaterialIcons('filled:logo_dev')
};

mount(document.body, <Icons value={icons}>
	<div theme='row'>
		<Icon
			name={Observer.timer(250).map(t => t % 2 === 0 ? 'logo' : 'feather')}
			size={48}
			style={{ color: 'red', fill: 'blue' }}
		/>
		<Icon name='logo' size={48} style={{ color: 'red' }} />
		<Icon name='logo' size={48} style={{ fill: 'red' }} />
		<Icon name='feather' size={48} style={{ stroke: 'red' }} />
	</div>
</Icons>);
