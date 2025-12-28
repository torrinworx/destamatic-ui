import { Observer, Typography, Paper, TextModifiers, RichField } from 'destamatic-ui';

const Example = () => {
	const value = Observer.mutable('Try typing: TODO, @mention, #tag, *emphasis*, or !!strong!! text.');

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

	return <div theme='column_fill_center' style={{ gap: 12 }}>
		<Typography
			type='p2'
			label='Rich note editor: type TODO, @mentions, #tags, or *emphasis* / **strong**.'
		/>
		<Paper theme='fill' >
			<TextModifiers value={modifiers}>
				<RichField value={value} type='p1' />
			</TextModifiers>
		</Paper>

		<Typography
			type='p2'
			label='Raw value:'
			style={{ marginTop: 4 }}
		/>
		<Paper theme='fill'>
			<Typography type='p1' label={value} />
		</Paper>
	</div>;
}

export default {
	example: Example,
	header: 'RichField',
};
