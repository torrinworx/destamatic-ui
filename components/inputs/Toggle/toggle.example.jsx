import { Toggle, Typography, Observer, Radio } from 'destamatic-ui';

const Example = () => {
	const type = Observer.mutable('outlined')
	const SelectRadio = Radio(type);
	const disable_toggles = Observer.mutable(false);

	return <div style={{ padding: 10 }}>
		<div theme='row_fill_center_wrap' >
			<SelectRadio value={'outlined'} label='outlined' />
			<SelectRadio value={'contained'} label='contained' />
		</div>
		<div theme='row_fill_center_wrap'>
			<Typography type='p1' label='Disable: ' />
			<Toggle value={disable_toggles} />
		</div>

		<div theme='divider' />
		<div theme='row_center_wrap'>
			<Toggle type={type} value={Observer.mutable(false)} disabled={disable_toggles} />
		</div>
	</div>;
};

export default {
	example: Example,
	header: 'Toggle',
};
