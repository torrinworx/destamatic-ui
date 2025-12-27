import { Typography, Slider, Toggle, TextField, Observer } from 'destamatic-ui'



const Example = () => {
	const disable_slider = Observer.mutable(false);
	const show_cover = Observer.mutable(true);
	const expand_slider = Observer.mutable(false);

	const hValue = Observer.mutable(50);
	const vValue = Observer.mutable(50);

	const step_value = Observer.mutable(1); // user types: 1, 5, 10, etc.
	const slider_step = step_value.map(s => {
		const n = parseFloat(s);
		return Number.isFinite(n) && n > 0 ? n : 1;
	});


	return <div style={{ margin: 10 }}>
		<div theme='row_fill_center_wrap'>
			<div theme='row_center_wrap' style={{ gap: 8 }}>
				<Typography type='p1' label='Disabled:' />
				<Toggle value={disable_slider} />
			</div>

			<div theme='row_center_wrap' style={{ gap: 8 }}>
				<Typography type='p1' label='Cover:' />
				<Toggle value={show_cover} />
			</div>

			<div theme='row_center_wrap' style={{ gap: 8 }}>
				<Typography type='p1' label='Expand:' />
				<Toggle value={expand_slider} />
			</div>

			<div theme='row_center_wrap' style={{ gap: 8 }}>
				<Typography type='p1' label='Steps:' />
				<TextField
					value={step_value}
					disabled={disable_slider}
					placeholder='# steps'
				/>
			</div>
		</div>

		<div theme='center_fill'>
			<Typography
				type='p1'
				label={Observer.all([hValue, vValue]).map(([h, v]) =>
					`Horizontal: ${Math.round(h)} | Vertical: ${Math.round(v)}`
				)}
			/>
		</div>

		<div theme='divider' />

		<div theme='row_fill_center' style={{ width: '100%' }}>
			<Slider
				type='horizontal'
				disabled={disable_slider}
				cover={show_cover}
				expand={expand_slider}
				value={hValue}
				step={slider_step}
				min={Observer.immutable(0)}
				max={Observer.immutable(100)}
			/>
		</div>

		<div
			theme='row_center_wrap'
			style={{
				height: expand_slider.map(e => e ? 600 : null),
				padding: 10,
				boxSizing: 'border-box',
			}}
		>
			<Slider
				type='vertical'
				disabled={disable_slider}
				cover={show_cover}
				expand={expand_slider}
				value={vValue}
				step={slider_step}
				min={Observer.immutable(0)}
				max={Observer.immutable(100)}
			/>
		</div>
	</div>;
};

export default {
	example: Example,
	header: 'Slider',
};