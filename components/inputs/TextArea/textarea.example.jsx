import { TextArea, Typography, Toggle, TextField, Radio, Observer, Button, Shown } from 'destamatic-ui';

const Example = () => {
	const type = Observer.mutable('contained')
	const SelectRadio = Radio(type);

	const disable_textarea = Observer.mutable(false);
	const expand_textarea = Observer.mutable(false);

	const ta_value = Observer.mutable(
		`TextArea demo...
	
	- controlled via Observer
	- disable toggle
	- expand toggle
	- auto-expands with optional maxHeight`
	);

	const ta_maxHeight_value = Observer.mutable('auto');
	const ta_maxHeight = ta_maxHeight_value.map(s => {
		const n = parseFloat(s);
		return Number.isFinite(n) && n > 0 ? n : null;
	});
	return <div style={{ padding: 10 }} >
		<div theme='row_fill_center_wrap' >
			<SelectRadio value={'contained'} label='contained' />
			<SelectRadio value={'outlined'} label='outlined' />
			<SelectRadio value={'text'} label='text' />
		</div>

		<div
			theme='row_fill_center'
			style={{ margin: 10, gap: 20, flexWrap: 'wrap' }}
		>
			<div theme='row_center_wrap' style={{ gap: 8 }}>
				<Typography type='p1' label='Disabled:' />
				<Toggle value={disable_textarea} />
			</div>

			<div theme='row_center_wrap' style={{ gap: 8 }}>
				<Typography type='p1' label='Expand:' />
				<Toggle value={expand_textarea} />
			</div>

			<div theme='row_center_wrap' style={{ gap: 8 }}>
				<Typography type='p1' label='maxHeight (px):' />
				<TextField
					type='outlined'
					value={ta_maxHeight_value}
					placeholder='maxHeight (px)'
					style={{ width: 100 }}
				/>
				<Typography
					type='p1'
					label={ta_maxHeight.map(h =>
						h ? `→ ${h}px` : '→ auto'
					)}
				/>
			</div>

			<div theme='row_center_wrap' style={{ gap: 8 }}>
				<Button
					label='Clear'
					onClick={() => ta_value.set('')}
				/>
				<Button
					label='Fill'
					onClick={() =>
						ta_value.set(
							`Here's some content.

You can:
- type normally
- paste big blocks
- auto-expand until maxHeight
- use expand to fill layout`
						)
					}
				/>
			</div>
		</div>

		<div theme='row_fill_center' >
			<Typography
				type='p1'
				label={Observer.all([ta_value, ta_maxHeight]).map(([v, h]) => {
					const text = String(v || '');
					const lines = text.split('\n').length;
					return `Length: ${text.length} chars · Lines: ${lines} · maxHeight: ${h ? h + 'px' : 'auto'}`;
				})}
			/>
		</div>

		<div theme='divider' />
		<div theme='row_fill_center'>
			<TextArea
				type={type}
				value={ta_value}
				disabled={disable_textarea}
				expand={expand_textarea}
				maxHeight={ta_maxHeight}
				placeholder='Type here...'
			/>

		</div>
	</div>;
};


export default {
	example: Example,
	header: 'TextArea',
};
