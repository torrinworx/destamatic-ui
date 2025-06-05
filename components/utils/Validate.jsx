import { Observer } from 'destam-dom';

import Theme from './Theme';
import Shown from './Shown';
import Icon from '../display/Icon';
import createContext from './Context';
import Typography from '../display/Typography';
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
	phone: (valueObserver) => {
		let val = valueObserver.get() || '';
		const digits = val.replace(/\D/g, '');

		let formatted = digits;
		if (digits.length > 3) {
			formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}`;
		}
		if (digits.length > 6) {
			formatted = `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
		}

		valueObserver.set(formatted);

		if (digits.length < 10) {
			return 'Please enter a valid 10-digit phone number.';
		}
		return '';
	},

	email: (valueObserver) => {
		let val = valueObserver.get() || '';
		val = val.trim();

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

		valueObserver.set(val);

		if (val && !emailRegex.test(val)) {
			return 'Please enter a valid email address.';
		}
		return '';
	},

	// 16-digit credit card format, e.g. #### #### #### ####
	pan: (valueObserver) => {
		let val = valueObserver.get() || '';
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

		valueObserver.set(formatted);

		if (digits.length < 16) {
			return 'Invalid credit card number. Must be 16 digits.';
		}
		return '';
	},

	expDate: (valueObserver) => {
		let val = valueObserver.get() || '';
		const digits = val.replace(/\D/g, '');
		let mm = digits.slice(0, 2);
		let yy = digits.slice(2, 4);

		let formatted = mm;
		if (yy) {
			formatted += `/${yy}`;
		}

		valueObserver.set(formatted);

		if (digits.length < 4) {
			return 'Expiration date must be in MM/YY format.';
		}
		const month = parseInt(mm, 10) || 0;
		if (month < 1 || month > 12) {
			return 'Invalid expiration month.';
		}
		return '';
	},

	postalCode: (valueObserver) => {
		let val = valueObserver.get() || '';
		const alphanumeric = val.replace(/\s|-/g, '').toUpperCase();

		const hasLetters = /[A-Z]/.test(alphanumeric);
		if (hasLetters) {
			const p1 = alphanumeric.slice(0, 3);
			const p2 = alphanumeric.slice(3, 6);

			let formatted = p1;
			if (p2) {
				formatted += ` ${p2}`;
			}
			valueObserver.set(formatted);

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
			valueObserver.set(formatted);

			if (digits.length !== 5 && digits.length !== 9) {
				return 'Invalid US ZIP code. Use 5 or 9 digits (e.g., 12345 or 12345-6789).';
			}
			return '';
		}
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

		return <Shown value={valid} invert>
			<div theme="row_validate_wrapper">
				<Icon name="alert-circle" theme="validate_icon" />
				<Typography type="validate" label={error} />
			</div>
		</Shown>;
	};
}));
