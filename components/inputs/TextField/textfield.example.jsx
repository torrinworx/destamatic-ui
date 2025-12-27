import { Typography, TextField, Toggle, Observer, Radio } from 'destamatic-ui';

const Example = () => {
	const type = Observer.mutable('contained')
	const SelectRadio = Radio(type);
	const disable_textfields = Observer.mutable(false);
	const expand_textfields = Observer.mutable(false);

	return <div style={{ margin: 10 }}>
		<div theme='row_fill_center_wrap' >
			<SelectRadio value={'contained'} label='contained' />
			<SelectRadio value={'outlined'} label='outlined' />
			<SelectRadio value={'text'} label='text' />
		</div>
		<div theme='row_fill_center_wrap'>
			<Typography type='p1' label='Disable: ' />
			<Toggle value={disable_textfields} />
			<Typography type='p1' label='Expand: ' />
			<Toggle value={expand_textfields} />
		</div>

		<div theme='divider' />
		<div theme='row_center_wrap'>
			<TextField
				type={type}
				disabled={disable_textfields}
				placeholder='textfield'
				value={Observer.mutable('')}
				expand={expand_textfields}
			/>
		</div>
	</div>;
};

export default {
	example: Example,
	header: 'TextField',
};
