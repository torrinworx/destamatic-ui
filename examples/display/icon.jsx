import { Observer } from 'destam';
import { mount } from 'destam-dom';
import { Icon, Typography } from 'destamatic-ui';

const name = Observer.timer(500).map(t => t % 2 === 0 ? 'feather' : 'user');
const nameMaterial = Observer.timer(500).map(t => t % 2 === 0 ? 'face' : 'help');

const libraryBoth = Observer.timer(500).map(t => t % 2 === 0 ? 'material' : 'feather')
const both = Observer.timer(500).map(t => t % 2 === 0 ? { name: 'logo_dev', library: 'material' } : { name: 'feather', library: 'feather' })

mount(document.body, <div>
	<Typography type='h4' label='Feather Icons:' />
	{Array.from({ length: 10 }).map(() => (
		<Icon library='feather' name='feather' />
	))}
	<Typography type='h4' label='Updating Icons:' />
	{Array.from({ length: 10 }).map(() => (
		<Icon library='feather' name={name} />
	))}

	<Typography type='h4' label='Styled Icons:' />
	<Icon library='feather' name='feather' style={{ height: 100, width: 100 }} />
	{/* or: */}
	<Icon library='feather' name='feather' size={100} />
	<Icon library='feather' name='feather' size={100} style={{ color: 'red' }} />
	<Icon library='feather' name='feather' size={100} style={{ fill: 'red' }} />

	<Typography type='h4' label='Material Icons:' />

	<Icon library="material" name={nameMaterial} />
	<Icon library="material" name="round:face" />
	<Icon library="material" name="outlined:help" />
	<Icon library="material" name="outlined:help" size={100} style={{ fill: 'blue' }} />

	<Typography type='h4' label='Switching between libraries:' />

	<Icon library={libraryBoth} name='save' size={100} />
	<Icon library={both.map(m => m.library)} name={both.map(m => m.name)} size={100} />

	<Typography type='h4' label='Custom Icons:' />
	<Icon library="custom" name="outlined:help" size={100} style={{ fill: 'blue' }} />

</div>);
