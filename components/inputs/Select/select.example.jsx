import { Typography, Observer, PopupContext, Popup, Select } from 'destamatic-ui';

const Example = () => {
	const input = Observer.mutable('');

	const options = {
		'option 1': () => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_self'),
		'option 2': () => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_self'),
		'option 3': () => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_self'),
		'option 4': () => window.open('https://www.youtube.com/watch?v=dQw4w9WgXcQ', '_self'),
	};

	return <div style={{ padding: 10 }}>
		<div
			theme="row_center_wrap"
			style={{
				position: 'relative',
				height: 500,
				width: '100%',
				overflow: 'hidden',
			}}
		>
			<PopupContext>
				  <Popup />

				<div
					style={{
						position: 'absolute',
						inset: 0,
						display: 'flex',
						alignItems: 'center',
						justifyContent: 'center',
						flexDirection: 'column',
						gap: 10,
					}}
				>
					<div style={{ pointerEvents: 'auto' }}>
						<Typography label={input} />
						<Select
							options={['one', 'two', 'three']}
							style={{ width: 100 }}
							type="contained"
							value={Observer.mutable('one')}
						/>
						<Select
							options={Array(70).fill(null).map((_, i) => String.fromCharCode(i + 41))}
							style={{ width: 100 }}
							type="contained"
							value={Observer.mutable('a')}
						/>
					</div>
				</div>

				{[
					['left', 'top'],
					['right', 'top'],
					['left', 'bottom'],
					['right', 'bottom'],
				].map(([a, b]) => (
					<Select
						key={`${a}-${b}`}
						style={{
							position: 'absolute',
							[a]: 8,
							[b]: 8,
							width: 120,
						}}
						value={input}
						options={Array(100).fill(null).map((_, i) => i)}
					/>
				))}

				<div style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)' }}>
					<Select
						placeholder="Functions"
						options={Object.keys(options)}
						value={Observer.immutable().setter((key) => options[key]())}
						style={{ width: 150, border: 'none' }}
						type="text"
					/>
				</div>

			</PopupContext>
		</div>
	</div>;
};

export default {
	example: Example,
	header: 'Select',
};
