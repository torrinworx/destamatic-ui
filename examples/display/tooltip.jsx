import { Tooltip, popups, Detached } from 'destamatic-ui';
import { mount, Observer } from 'destam-dom';

const Comp = ({style}) => {
	return <div theme="center" style={{position: 'absolute', inset: 0, flexDirection: 'column', gap: 40, pointerEvents: 'none', ...style}}>
		<Tooltip label="show tooltip below" locations={[Detached.BOTTOM_CENTER]}>
			<div style={{pointerEvents: 'auto'}}>This is some text</div>
		</Tooltip>

		<Tooltip label="show tooltip above" locations={[Detached.TOP_CENTER]}>
			<div style={{pointerEvents: 'auto'}}>This is some text</div>
		</Tooltip>

		<Tooltip label="show tooltip to the right" locations={[Detached.RIGHT_CENTER]}>
			<div style={{pointerEvents: 'auto'}}>This is some text</div>
		</Tooltip>

		<Tooltip label="show tooltip to the left" locations={[Detached.LEFT_CENTER]}>
			<div style={{pointerEvents: 'auto'}}>This is some text</div>
		</Tooltip>

		<Tooltip>
			<div style={{pointerEvents: 'auto'}}>This is some text</div>

			<mark:popup>
				<div style={{
					transition: 'none',
					color: Observer.timer(10).map(t => `hsl(${(t / 100 * 360).toFixed(0)}deg 100% 50%)`),
				}}>
					Custom stuff
				</div>
			</mark:popup>
		</Tooltip>
	</div>
};

mount(document.body, <>
	<Comp />
	<Comp style={{alignItems: 'start'}} />
	<Comp style={{alignItems: 'end'}} />
	<Tooltip label="show tooltip">
		<div style={{position: 'absolute'}}>This is some text</div>
	</Tooltip>
	<Tooltip label="show tooltip">
		<div style={{position: 'absolute', right: 0}}>This is some text</div>
	</Tooltip>
	<Tooltip label="show tooltip">
		<div style={{position: 'absolute', bottom: 0}}>This is some text</div>
	</Tooltip>
	<Tooltip label="show tooltip">
		<div style={{position: 'absolute', bottom: 0, right: 0}}>This is some text</div>
	</Tooltip>
	<Tooltip label="show tooltip">
		<div style={{position: 'absolute', bottom: 100, right: -70, width: 100, height: 10, background: 'red'}}/>
	</Tooltip>
	<Tooltip label="show tooltip">
		<div style={{position: 'absolute', bottom: 0, left: 300, height: 100, width: 10, background: 'red'}}/>
	</Tooltip>
	{popups}
</>);
