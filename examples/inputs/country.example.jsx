import { mount, Observer } from 'destam-dom';
import { Country, Select, Typography, Shown, PopupContext, Popup } from 'destamatic-ui';

const value = Observer.mutable(null);
const country = Observer.mutable(null);
country.watch(() => console.log('country: ', country.get()));

// Country can be used on it's own, but the 'country' variable returns a list of regions you can use to create a full region form
// as seen below.
const region = Observer.mutable(null);
region.watch(() => console.log('region: ', region.get()));

mount(document.body, <PopupContext>

	<Typography type='h4' label='Country' />
	<Country value={value} type='contained' country={country} placeholder='Select a Country' />

	<Shown value={country.map(c => {
		region.set('Select a Region');
		return c && Array.isArray(c[2]);
	})}>
		<Typography type='h4' label='Region' />
		<Select
			type='contained'
			placeholder='Select Region'
			value={region}
			options={country.map(c => c[2].map(r => r[0]))} // we set region to the string, but r contains region name and code: ['Ontario', 'ON']
		/>
	</Shown>
	<Popup />
</PopupContext>);
