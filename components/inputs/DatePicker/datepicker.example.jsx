import { Typography, DatePicker, Button, Observer } from 'destamatic-ui';

const Example = () => {
	const date = Observer.mutable(new Date());
	const fmt = d =>
		`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

	return <div theme='column_center' style={{ gap: 10 }}>
		<div theme='row' style={{ gap: 10 }}>
			<Button
				type='outlined'
				label='Today'
				onClick={() => date.set(new Date())}
			/>
			<Button
				type='contained'
				label='Advance 1 year'
				onClick={() => {
					const d = new Date(date.get());
					d.setFullYear(d.getFullYear() + 1);
					date.set(d);
				}}
			/>
		</div>
		<Typography
			type='p1'
			label={date.map(d => `Selected date: ${fmt(d)}`)}
		/>

		<div theme='divider' />

		<div theme='column_center_fill' >
			<DatePicker value={date} />
		</div>
	</div>;
};

export default {
	example: Example,
	header: 'DatePicker',
};
