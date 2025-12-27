import { Radio, Observer, Typography, Toggle, TextField } from 'destamatic-ui';

const Example = () => {
	const selected = Observer.mutable(1);
	const RadioGroup = Radio(selected);
	const options = Observer.mutable(5);
	const labels = Observer.mutable(true);

	const Comp = ({ o }) => Array.from({ length: o }, (_, i) => i).map(num => <RadioGroup
		key={num}
		value={num}
		label={labels.map(l => (l ? `Option ${num + 1}` : null))}
	/>)

	return <div style={{ margin: 10 }}>
		<div theme='row_fill_center_wrap'>
			<div theme='row'>
				<Typography type='p1' label='Labels: ' />
				<Toggle value={labels} />
			</div>
			<div theme='row_center_wrap'>
				<Typography type='p1' label='# options: ' />
				<TextField
					value={options}
					placeholder='# options'
				/>
			</div>
		</div>

		<div theme='divider' />
		<div theme='center_column_fill' style={{ gap: 10 }}>
			{options.throttle(2).map(o => o < 100 ? <Comp o={o} /> : <Comp o={100} />)}
		</div>
	</div>;
};

export default {
	example: Example,
	header: 'Radio',
};
