import { Typography, TextModifiers, TextField, Radio, Toggle, Observer } from 'destamatic-ui';

const Example = () => {
	const type = Observer.mutable('h2')
	const SelectRadio = Radio(type);
	const italic = Observer.mutable(false);
	const bold = Observer.mutable(false);
	const value = Observer.mutable('Try typing: TODO, DONE, @mention, #tag, *emphasis*, or !!strong!! text.');
	const modifiers = [
		{
			check: /\b(TODO|DONE)\b/g,
			atomic: true,
			return: match => (
				<span
					style={{
						display: 'inline-block',
						padding: '0 4px',
						borderRadius: 4,
						background: match === 'DONE' ? 'green' : 'orange',
						color: 'white',
						fontWeight: 600,
					}}
				>
					{match}
				</span>
			),
		},
		{
			check: /@\w+/g,
			atomic: false,
			return: match => (
				<span
					style={{
						display: 'inline-block',
						color: 'blue',
						fontWeight: 500,
					}}
				>
					{match}
				</span>
			),
		},
		{
			check: /#\w+/g,
			atomic: false,
			return: match => (
				<span
					style={{
						display: 'inline-block',
						color: 'green',
						fontWeight: 500,
					}}
				>
					{match}
				</span>
			),
		},
		{
			check: /!!(.+?)!!/g,
			atomic: false,
			return: match => (
				<span style={{ fontWeight: 700, display: 'inline-block' }}>
					{match.slice(2, -2)}
				</span>
			),
		},
		{
			check: /\*(.+?)\*/g,
			atomic: false,
			return: match => (
				<span style={{ fontStyle: 'italic', display: 'inline-block' }}>
					{match.slice(1, -1)}
				</span>
			),
		},
	];

	return <div style={{ padding: 10 }}>
		<div theme='row_fill_center_wrap' >
			<SelectRadio value={'h1'} label='h1' />
			<SelectRadio value={'h2'} label='h2' />
			<SelectRadio value={'h3'} label='h3' />
			<SelectRadio value={'h4'} label='h4' />
			<SelectRadio value={'h5'} label='h5' />
			<SelectRadio value={'h6'} label='h6' />
			<SelectRadio value={'p1'} label='p1' />
			<SelectRadio value={'p2'} label='p2' />
		</div>
		<div theme='row_fill_center_wrap'>
			<div theme='row'>
				<Typography type='p1' label='Bold: ' />
				<Toggle value={bold} />
			</div>
			<div theme='row'>
				<Typography type='p1' label='Italic: ' />
				<Toggle value={italic} />
			</div>
		</div>

		<div theme='divider' />
		<div theme='column_center'>
			<Typography
				type={Observer.all([type, bold, italic]).map(
					([t, b, i]) =>
						[t, b && 'bold', i && 'italic'].filter(Boolean).join('_')
				)}
				label={`The quick brown fox jumps over the lazy dog.`}
			/>
		</div>

		<div theme='divider' />

		<div theme='row_fill_center_wrap'>
			<Typography type='p1' label='Text Modifiers:' />
			<TextField expand type='outlined' value={value} />
		</div>
		<div theme='divider' />

		<div theme='column_center'>
			<TextModifiers value={modifiers} >
				<Typography
					type={Observer.all([type, bold, italic]).map(
						([t, b, i]) =>
							[t, b && 'bold', i && 'italic'].filter(Boolean).join('_')
					)}
					label={value}
				/>
			</TextModifiers>
		</div>
	</div>;
};

export default {
	example: Example,
	header: 'Typography',
};
