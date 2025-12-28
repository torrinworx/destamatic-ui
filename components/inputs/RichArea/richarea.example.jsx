import { Observer, Typography, Paper, TextModifiers, RichArea } from 'destamatic-ui';

const Example = () => {
	const value = Observer.mutable(
		`Grocery list (try multi-line):

	- TODO buy milk
	- DONE grab coffee
	- Ask @sam about #party
	- Remember: *italics* and !!strong!! still work here.`
	);

	const modifiers = [
		{
			// TODO / DONE badges
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
			// @mentions
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
			// #tags
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
			// !!strong!!
			check: /!!(.+?)!!/g,
			atomic: false,
			return: match => (
				<span style={{ fontWeight: 700, display: 'inline-block' }}>
					{match.slice(2, -2)}
				</span>
			),
		},
		{
			// *emphasis*
			check: /\*(.+?)\*/g,
			atomic: false,
			return: match => (
				<span style={{ fontStyle: 'italic', display: 'inline-block' }}>
					{match.slice(1, -1)}
				</span>
			),
		},
	];

	return <div theme='column_fill_center'>
		<Typography
			type='p2'
			label='RichArea: multiline rich text. Try new lines, TODO/DONE, @mentions, #tags, *italics*, and !!strong!!'
		/>

		<Paper theme='tight' style={{ maxWidth: 700 }}>
			<TextModifiers value={modifiers}>
				<RichArea
					value={value}
					placeholder='Type a multi-line rich note...'
					maxHeight={200}
				/>
			</TextModifiers>
		</Paper>

		<Typography
			type='p2'
			label='Raw value:'
		/>
		<Paper theme='row_tight' style={{ maxWidth: 700 }}>
			<Typography type='p2' label={value} />
		</Paper>
	</div>;
}

export default {
	example: Example,
	header: 'RichArea',
};
