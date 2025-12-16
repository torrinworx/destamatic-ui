import { Observer, Insert, Modify, Delete } from 'destam-dom';

import {mark} from '../../utils/h.jsx';
import Detached from '../../utils/Detached.jsx';
import Theme from '../../utils/Theme.jsx';
import ThemeContext from '../../utils/ThemeContext.jsx';
import Paper from '../Paper/Paper.jsx';
import '../Typography/Typography.jsx';
import trackedMount from '../../../util/trackedMount.js';
import categories from '../../../util/categories.js';

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
	const Tooltip = ({children, label, enabled = false, locations = defaultLocations, type}, cleanup, mounted) => {
		const [popup, anchor] = categories(children, ['popup', 'anchor'], 'anchor');
		const [elems, virtual] = trackedMount(anchor);
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
				<Paper theme="tooltip" type={type}>
					{label ?? null} {popup}
				</Paper>
			</mark:popup>
		</Detached>;
	};

	return Tooltip;
});
