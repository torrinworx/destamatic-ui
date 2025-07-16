import { Observer, OArray } from 'destam';
import { allCountries } from 'country-region-data';

import Select from './Select';
import ThemeContext from '../utils/ThemeContext';

// a component designed to systemically retreive country information from a user
// using iso standard regions for purposes of addressing.
// this component depends on an optional dependency: country-region-data

export default ThemeContext.use(h => {
	const Country = ({ value = null, country = null, ...props }, cleanup) => {
		if (!(value instanceof Observer)) value = Observer.mutable(value);
		if (!(country instanceof Observer)) country = Observer.mutable(country);
		const countries = allCountries.map(c => c[0]);
		cleanup(value.effect(c => country.set(allCountries.find(ac => ac[0] === c))));

		return <Select
				theme='country'
				value={value}
				options={countries}
				{...props}
			/>;
	};
	return Country;
});
