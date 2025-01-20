import { Observer, Insert, Modify, Delete } from 'destam-dom';

import Detached from '../utils/Detached';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import Paper from '../display/Paper';
import Typography from '../display/Typography';
import trackedMount from '../../util/trackedMount';

Theme.define({
	tooltip_paper: {
		border: `1px solid $color`,
		margin: 10,
		opacity: '80%',
	},

	tooltip_typography: {
	},
});

export default ThemeContext.use(h => {
	const Tooltip = ({children, label, locations, type = "p4"}, cleanup, mounted) => {
		const [elems, virtual] = trackedMount(children);
		const hovered = Observer.mutable(false);

		let references = 0;
		const mouseenter = e => {
			references++;

			if (references === 1) {
				hovered.set(true);
			}
		};

		const mouseleave = e => {
			references--;

			if (references === 0) {
				hovered.set(false);
			}
		};

		cleanup(elems.observer.watch(delta => {
			const modify = delta instanceof Modify;

			if (modify || delta instanceof Delete) {
				delta.prev.removeEventListener('mouseenter', mouseenter);
				delta.prev.removeEventListener('mouseleave', mouseleave);
			}

			if (modify || delta instanceof Insert) {
				delta.value.addEventListener('mouseenter', mouseenter);
				delta.value.addEventListener('mouseleave', mouseleave);
			}
		}));

		cleanup(() => {
			for (const item of elems) {
				delta.prev.removeEventListener('mouseenter', mouseenter);
				delta.prev.removeEventListener('mouseleave', mouseleave);
			}
		});

		return <Detached enabled={hovered} locations={locations}>
			{virtual}
			{elems}

			<mark:popup>
				<Paper theme="tooltip">
					<Typography theme="tooltip" type={type} label={label} />
				</Paper>
			</mark:popup>
		</Detached>;
	};

	return Tooltip;
});
