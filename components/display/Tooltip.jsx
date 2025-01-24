import { Observer, Insert, Modify, Delete } from 'destam-dom';

import {mark} from '../utils/h';
import Detached from '../utils/Detached';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import Paper from '../display/Paper';
import '../display/Typography';
import trackedMount from '../../util/trackedMount';

Theme.define({
	tooltip_paper: {
		extends: 'typography_p1',
		border: `1px solid $color`,
		margin: 10,
		opacity: '80%',
	},
});

const defaultLocations = [
	Detached.BOTTOM_CENTER,
	Detached.TOP_CENTER,
	Detached.RIGHT_CENTER,
	Detached.LEFT_CENTER,
];

export default ThemeContext.use(h => {
	const Tooltip = ({children, label, enabled = false, locations = defaultLocations}, cleanup, mounted) => {
		const [elems, virtual] = trackedMount(children);
		if (!(enabled instanceof Observer)) enabled = Observer.mutable(enabled);

		if (!enabled.isImmutable()) {
			let references = 0;
			const mouseenter = e => {
				references++;

				if (references === 1) {
					enabled.set(true);
				}
			};

			const mouseleave = e => {
				references--;

				if (references === 0) {
					enabled.set(false);
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
		} else {
			enabled = enabled.map(Observer.mutable).unwrap();
		}

		return <Detached enabled={enabled} locations={locations}>
			{virtual}
			{elems}

			<mark:popup>
				<Paper theme="tooltip">
					{label}
				</Paper>
			</mark:popup>
		</Detached>;
	};

	return Tooltip;
});
