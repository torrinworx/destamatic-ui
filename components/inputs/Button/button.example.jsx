import { Button, Typography, Toggle, Observer, Icon, Radio } from 'destamatic-ui';

const Example = () => {
	const type = Observer.mutable('contained')
	const SelectRadio = Radio(type);
	const disable_buttons = Observer.mutable(false);
	const icon_position = Observer.mutable(false)
	const doneCheck = Observer.mutable(false);
	doneCheck.watch(() => {
		if (doneCheck.get()) {
			setTimeout(() => {
				doneCheck.set(false);
			}, 1200);
		}
	});

	return <div style={{ padding: 10 }}>
		<div theme='row_fill_center_wrap' >
			<SelectRadio value={'contained'} label='contained' />
			<SelectRadio value={'outlined'} label='outlined' />
			<SelectRadio value={'text'} label='text' />
			<SelectRadio value={'link'} label='link' />
		</div>
		<div theme='row_fill_center_warp'>
			<Typography type='p1' label='Disable: ' />
			<Toggle value={disable_buttons} />
		</div>
		<div theme='row_fill_center_warp'>
			<Typography type='p1' label='Icon Position: ' />
			<Toggle value={icon_position} />
		</div>

		<div theme='divider' />

		<div theme='row_center_wrap'>
			<Button
				type={type}
				label="Click Me"
				disabled={disable_buttons}
				onClick={() => { }}
			/>
			<Button
				type={type}
				disabled={disable_buttons}
				iconPosition={icon_position.map(p => p ? 'right' : 'left')}
				label="Click Me"
				icon={<Icon name="feather:external-link" />}
				onClick={() => { }}
			/>
			<Button
				round
				type={type}
				disabled={disable_buttons}
				icon={<Icon name="feather:external-link" />}
				onClick={() => { }}
			/>
			<Button
				type={type}
				disabled={disable_buttons}
				icon={<Icon name="feather:external-link" />}
				onClick={() => { }}
			/>
			<Button
				type={type}
				label="Shine"
				disabled={disable_buttons}
				onClick={() => { }}
				shine
			/>
			<Button
				type={type}
				iconPosition={icon_position.map(p => p ? 'right' : 'left')}
				disabled={disable_buttons}
				label={doneCheck.map(c => (c ? "Done!" : "Delay"))}
				icon={doneCheck.map(c =>
					c ? <Icon name="feather:check" />
						: <Icon name="feather:upload" />
				)}
				onClick={async () => {
					return new Promise(ok => setTimeout(() => { doneCheck.set(true); ok(); disable_buttons.set(false) }, 1000))
				}}
			/>
		</div>
	</div>;
};

export default {
	example: Example,
	header: 'Button',
};
