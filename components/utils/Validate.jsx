import { Observer } from 'destam-dom';

import Theme from './Theme';
import Shown from './Shown';
import Icon from '../display/Icon';
import createContext from './Context';
import { Typography } from '../display/Typography';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	validate: {
		fontSize: 16,
		color: '$color_error',
		fontWeight: 'bold',
	},
	validate_icon: {
		color: '$color_error',
		width: 20,
		height: 20,
		marginRight: 5
	},
	validate_wrapper: {
		padding: 10
	}
});

const validators = {
	phone: (value) => {
		let val = value.get() || '';
		const digits = val.replace(/\D/g, '');

		let formatted = digits;
		if (digits.length > 3) {
			formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}`;
		}
		if (digits.length > 6) {
			formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
		}

		value.set(formatted);

		if (digits.length < 10) {
			return 'Please enter a valid 10-digit phone number.';
		}
		return '';
	},

	email: (value) => {
		let val = value.get() || '';
		val = val.trim();

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		value.set(val);

		if (val && !emailRegex.test(val)) {
			return 'Please enter a valid email address.';
		}
		return '';
	},

	// 16-digit credit card format, e.g. #### #### #### ####
	pan: (value) => {
		let val = value.get() || '';
		const digits = val.replace(/\D/g, '');

		let formatted = digits;
		if (digits.length > 4) {
			formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 8);
		}
		if (digits.length > 8) {
			formatted = digits.slice(0, 4) + ' ' + digits.slice(4, 8) + ' ' + digits.slice(8, 12);
		}
		if (digits.length > 12) {
			formatted =
				digits.slice(0, 4) +
				' ' +
				digits.slice(4, 8) +
				' ' +
				digits.slice(8, 12) +
				' ' +
				digits.slice(12, 16);
		}

		value.set(formatted);

		if (digits.length < 16) {
			return 'Invalid credit card number. Must be 16 digits.';
		}
		return '';
	},

	expDate: (value) => {
		let val = value.get() || '';
		const digits = val.replace(/\D/g, '');
		let mm = digits.slice(0, 2);
		let yy = digits.slice(2, 4);

		let formatted = mm;
		if (yy) {
			formatted += `/${yy}`;
		}

		value.set(formatted);

		if (digits.length < 4) {
			return 'Expiration date must be in MM/YY format.';
		}
		const month = parseInt(mm, 10) || 0;
		if (month < 1 || month > 12) {
			return 'Invalid expiration month.';
		}
		return '';
	},

	postalCode: (value) => {
		let val = value.get() || '';
		const alphanumeric = val.replace(/\s|-/g, '').toUpperCase();

		const hasLetters = /[A-Z]/.test(alphanumeric);
		if (hasLetters) {
			const p1 = alphanumeric.slice(0, 3);
			const p2 = alphanumeric.slice(3, 6);

			let formatted = p1;
			if (p2) {
				formatted += ` ${p2}`;
			}
			value.set(formatted);

			const caRegex = /^[ABCEGHJ-NPRSTVXY]\d[ABCEGHJ-NPRSTV-Z]\s?\d[ABCEGHJ-NPRSTV-Z]\d$/i;
			if (!caRegex.test(formatted)) {
				return 'Invalid Canadian postal code (e.g., A1A 1A1).';
			}
			return '';
		} else {
			const digits = alphanumeric.replace(/\D/g, '');
			let formatted = digits;
			if (digits.length > 5) {
				formatted = digits.slice(0, 5) + '-' + digits.slice(5, 9);
			}
			value.set(formatted);

			if (digits.length !== 5 && digits.length !== 9) {
				return 'Invalid US ZIP code. Use 5 or 9 digits (e.g., 12345 or 12345-6789).';
			}
			return '';
		}
	},

	date: (value) => {
		// Get the raw user input, default to empty string if null/undefined:
		let val = value.get() || '';

		// Strip out any non-digit characters:
		const digits = val.replace(/\D/g, '');

		// Extract the potential dd, mm, and yyyy:
		const dd = digits.slice(0, 2);
		const mm = digits.slice(2, 4);
		const yyyy = digits.slice(4, 8);

		// Build the formatted string with slashes:
		let formatted = dd;
		if (mm) {
			formatted += `/${mm}`;
		}
		if (yyyy) {
			formatted += `/${yyyy}`;
		}

		// Update the underlying observable with the formatted value:
		value.set(formatted);

		if (digits.length < 8) {
			return 'Please use dd/mm/yyyy format.';
		}

		const day = parseInt(dd, 10);
		const month = parseInt(mm, 10);
		const year = parseInt(yyyy, 10);

		// Simple validations: day 1–31, month 1–12, naive year range check:
		if (month < 1 || month > 12) {
			return 'Invalid month (must be between 01 and 12).';
		}
		if (day < 1 || day > 31) {
			return 'Invalid day (must be between 01 and 31).';
		}

		const testDate = new Date(year, month - 1, day);
		// Month/day check after construction to ensure it didn’t roll over:
		if (
			testDate.getFullYear() !== year ||
			testDate.getMonth() !== month - 1 ||
			testDate.getDate() !== day
		) {
			return 'This date is invalid—please check day/month/year.';
		}

		// If no errors, return an empty string:
		return '';
	},

	number: (value) => {
		let val = value.get() || '';
		const intRegex = /^-?\d+$/;

		if (!intRegex.test(val)) {
			return 'Please enter a valid integer.';
		}
		return '';
	},

	float: (value) => {
		let val = value.get() || '';
		const floatRegex = /^\d+\.\d+$/;

		if (!floatRegex.test(val)) {
			return 'Please enter a valid decimal number with a fractional part.';
		}
		return '';
	},
};

export const ValidateContext = createContext(() => null, (value) => {
	const values = Observer.mutable([])
	Observer.all(values).watch(() => {
		const result = values.get().every(value => value.get() === true);
		value.set(result);
	});

	return values;
});

export const Validate = ValidateContext.use(v => ThemeContext.use(h => {
	return ({ value = true, validate, valid = true, signal, error = '' }, cleanup) => {
		if (!(valid instanceof Observer)) valid = Observer.mutable(valid);
		if (!(error instanceof Observer)) error = Observer.mutable(error);
		if (v instanceof Observer) v.set([...v.get(), valid]);

		const runValidation = (val) => {
			let result = '';
			if (typeof validate === 'string' && validate in validators) {
				result = validators[validate](val);
			} else if (typeof validate === 'function') {
				result = validate(val);
			} else {
				console.error(`Validator '${validate}' is not defined or is invalid.`);
			}

			if (result) {
				valid.set(false);
				error.set(result);
			} else {
				valid.set(true);
				error.set('');
			}
		};

		if (!signal || !(signal instanceof Observer)) {
			cleanup(value.watch(() => {
				runValidation(value);
			}));
		} else {
			cleanup(signal.watch(trigger => {
				if (trigger.value) {
					runValidation(value);
					signal.set(false);
				}
			}));
		}

		return <Shown value={error}>
			<div theme="row_validate_wrapper">
				<Icon name="alert-circle" theme="validate_icon" />
				<Typography type="validate" label={Observer.immutable(error)} />
			</div>
		</Shown>;
	};
}));
