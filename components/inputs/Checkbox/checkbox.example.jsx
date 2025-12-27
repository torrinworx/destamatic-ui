import { Checkbox, Typography, Toggle, Observer } from 'destamatic-ui';

const Example = () => {
	const checkboxCount = Observer.mutable(0);
	const disable_checkboxes = Observer.mutable(false)

	return <div style={{ padding: 10 }}>
		<div theme='row_fill_center_warp'>
			<Typography type='p1' label='Disable: ' />
			<Toggle value={disable_checkboxes} />
		</div>

		<div theme='divider' />
		<Typography
			type='p1'
			label={checkboxCount.map(c => `Boxes checked: ${c}`)}
		/>

		<div theme='column_center'>
			{Array.from({ length: 8 }).map(() => <div theme='row'>{Array.from({ length: 8 }).map(() => Observer.mutable(false)).map(box =>
				<Checkbox
					disabled={disable_checkboxes}
					value={box}
					onChange={val => {
						if (val) {
							checkboxCount.set(checkboxCount.get() + 1);
						} else {
							checkboxCount.set(checkboxCount.get() - 1);
						}
					}}
				/>
			)}</div>)}
		</div>
	</div>;
};

export default {
	example: Example,
	header: 'Checkbox',
};
