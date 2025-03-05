import { mount, Observer } from 'destam-dom';
import { FeatherIcons, MaterialIcons, Icon, Icons } from 'destamatic-ui';

const icons = {
	feather: FeatherIcons('feather'),
	logo: MaterialIcons('filled:logo_dev')
};

mount(document.body, <Icons icons={icons}>
	<Icon name={Observer.timer(250).map(t => {
		// console.log(t % 2 === 0 ? 'logo' : 'feather')
		return t % 2 === 0 ? 'logo' : 'feather'
	})} size={48} style={{ color: 'red', fill: 'blue' }} />

	<Icon name='logo' size={48} style={{ fill: 'red' }} />
	<Icon name='feather' size={48} style={{ stroke: 'red' }} />
</Icons>);
