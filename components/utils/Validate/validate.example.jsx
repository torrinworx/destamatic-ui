import { Button, Typography, Validate, ValidateContext, TextField, Paper, Observer } from 'destamatic-ui';

const Example = () => {
	const phone = Observer.mutable('');
	const email = Observer.mutable('');
	const pan = Observer.mutable('');
	const expDate = Observer.mutable('');
	const postalCode = Observer.mutable('');
	const date = Observer.mutable('');
	const number = Observer.mutable('');
	const float = Observer.mutable('');

	const name = Observer.mutable('');
	const age = Observer.mutable('');
	const submit = Observer.mutable(false);
	const allValid = Observer.mutable(true);

	return <div theme='column_center' style={{ margin: 10, gap: 20 }}>

		<Paper>
			<Typography type="h4" label="Live Validation" />

			<div>
				<Typography type="p2" label="Phone" />
				<TextField placeholder="Phone" value={phone} />
				<Validate value={phone} validate="phone" />

				<Typography type="p2" label="Email" />
				<TextField placeholder="Email" value={email} />
				<Validate value={email} validate="email" />

				<Typography type="p2" label="Credit Card (PAN)" />
				<TextField placeholder="16-digit card" value={pan} />
				<Validate value={pan} validate="pan" />

				<Typography type="p2" label="Expiration (MM/YY)" />
				<TextField placeholder="MM/YY" value={expDate} />
				<Validate value={expDate} validate="expDate" />

				<Typography type="p2" label="Postal Code (US ZIP or Canadian)" />
				<TextField placeholder="Postal Code" value={postalCode} />
				<Validate value={postalCode} validate="postalCode" />

				<Typography type="p2" label="Date (dd/mm/yyyy)" />
				<TextField placeholder="dd/mm/yyyy" value={date} />
				<Validate value={date} validate="date" />

				<Typography type="p2" label="Integer" />
				<TextField placeholder="Number" value={number} />
				<Validate value={number} validate="number" />

				<Typography type="p2" label="Float" />
				<TextField placeholder="Float (e.g. 12.34)" value={float} />
				<Validate value={float} validate="float" />
			</div>
		</Paper>

		<Paper>
			<Typography
				type="h4"
				label="Submission based validation"
			/>

			<ValidateContext value={allValid}>
				<div theme="column_fill">
					<Typography type="p2" label="Name (no numbers)" />
					<TextField placeholder="Name" value={name} />
					<Validate
						value={name}
						validate={val => {
							const v = val.get() || '';
							if (!v.trim()) return 'Name is required.';
							if (/\d/.test(v)) return 'Name cannot contain numbers.';
							return '';
						}}
						signal={submit}
					/>

					<Typography type="p2" label="Age (number)" />
					<TextField placeholder="Age" value={age} />
					<Validate
						value={age}
						validate={val => {
							const v = (val.get() || '').trim();
							if (!v) return 'Age is required.';
							if (isNaN(v)) return 'Age must be a number.';
							if (Number(v) <= 0) return 'Age must be greater than 0.';
							return '';
						}}
						signal={submit}
					/>
				</div>
				<div theme='column_center_fill'>
					<Button
						type="contained"
						label="Submit"
						onClick={() => {
							// trigger all validators that use this signal
							submit.set({ value: true });

							// small timeout allows ValidateContext to aggregate
							setTimeout(() => {
								if (allValid.get()) {
									console.log('Form submitted!');
								} else {
									console.log(
										'Please fix validation errors before submitting.'
									);
								}
							}, 0);
						}}
					/>
					<Typography
						type="p2"
						label={allValid.map(v =>
							v ? '✅ All fields valid' : '❌ Some fields invalid'
						)}
					/>

				</div>
			</ValidateContext>
		</Paper>
	</div>;
};

export default {
	open: true,
	example: Example,
	header: 'Validate',
};
