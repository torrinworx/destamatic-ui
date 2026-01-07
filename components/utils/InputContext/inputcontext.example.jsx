import { Button, Typography, Toggle, Observer, OArray, InputContext, Slider } from 'destamatic-ui';

const Example = () => {
	const log = OArray([]);
	const tracking = Observer.mutable(true);

	const addEvent = (e) => {
		log.unshift({
			ts: Date.now(),
			...e,
		});

		if (log.length > 5) log.pop();
	};

	const config = {
		meta: { scope: 'root' },
		onClick: addEvent,
		onEnter: addEvent,
		onSlideStart: addEvent,
		onSlide: addEvent,
		onSlideKey: addEvent,
	};

	const LogEntry = ({ each }) => <div>
		{`[${new Date(each.ts).toLocaleTimeString()}] ` +
			`${each.scope ? each.scope + ' ' : ''}` +
			`${each.component}.${each.type} ` +
			`${each.id ? `id=${each.id} ` : ''}` +
			(each.label ? `label="${each.label}" ` : '') +
			(each.start !== undefined ? `start=${each.start} ` : '') +
			(each.end !== undefined ? `end=${each.end} ` : '')}
	</div>

	return <InputContext value={config}>
		<div style={{ margin: 10 }}>
			<div theme='row_fill_center_wrap'>
				<div theme='row_center_wrap' style={{ gap: 8 }}>
					<Typography type='p1' label='Tracking:' />
					<Toggle track={false} value={tracking} />
				</div>
			</div>

			<div theme='divider' />

			<div theme='row_wrap'>
				<div theme='fill' style={{ flex: '1' }} >
					<Button id='custom-button-id' track={tracking} type='contained' label='test' onClick={() => { console.log('button clicked') }} />
					<Slider id='custom-slider-id' track={tracking} value={Observer.mutable(0.5)} />
				</div>
				<div theme='column_center_fill' style={{ flex: '1' }}>
					<LogEntry each={log} />
				</div>
			</div>
		</div>
	</InputContext>
};

export default {
	example: Example,
	header: 'InputContext',
};
