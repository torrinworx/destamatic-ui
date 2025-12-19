import Observer from 'destam/Observer';

import { mark } from '../../utils/h/h.jsx';
import useAbort from '../../../util/abort.js';
import Theme from '../../utils/Theme/Theme.jsx';
import Detached from '../../utils/Detached/Detached.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

import categories from '../../../util/categories.js';

export default ThemeContext.use(h => {
	const Attached = ({children, focused, collapsed, Anchor, anchorTheme, type, theme}) => {
		const [popup, anchor] = categories(children, ['popup', 'anchor'], 'anchor');
		const [preFocus, postFocus] = focused.memo(2);
		const expanded = Observer.all([
			postFocus,
			Observer.immutable(collapsed)
		]).map(([foc, col]) => foc && !col ? foc : false).setter(val => postFocus.set(val)).memo();

		const ref = anchor.props.ref ?? Observer.mutable(null);
		const Paper = popup.props.ref ?? <raw:div />;

		const resizeObserver = Observer.mutable(0);

		const Popup = Theme.use(themer => (_, cleanup) => {
			const radius = themer(theme, anchorTheme, type).vars('radius');
			const style = resizeObserver.map(() => getComputedStyle(ref instanceof Observer ? ref.get() : ref));

			const foc = Observer.mutable(false);

			cleanup(useAbort(signal => {
				requestAnimationFrame(() => {
					foc.set(true);
				}, {signal});

				window.addEventListener('keydown', e => {
					if (e.key === 'Escape') {
						focused.set(false);
					}
				}, { signal });
			})());

			return <Paper
				theme={[theme, popup.props.theme, type, 'popup', foc.bool('focused', null)]}
				style={{
					flex: '1 1 auto',
					width: style.map(style => style.width),
					overflow: 'auto',
					borderRadius: Observer.all([expanded, radius]).map(([f, r]) => {
						if (f === Detached.TOP_LEFT_RIGHT) {
							return `${r} ${r} 0px 0px`;
						} else if (f === Detached.BOTTOM_LEFT_RIGHT) {
							return `0px 0px ${r} ${r}`;
						} else {
							return null;
						}
					}),
					clipPath: Observer.all([expanded, radius]).map(([f, r]) => {
						if (f === Detached.TOP_LEFT_RIGHT) {
							return `inset(-${r} -${r} 0px -${r})`;
						} else if (f === Detached.BOTTOM_LEFT_RIGHT) {
							return `inset(0px -${r} -${r} -${r})`;
						} else {
							return null;
						}
					}),
					...popup.props.style,
				}}
			>
				{popup}
			</Paper>;
		});

		return <Detached
			enabled={expanded}
			locations={[
				Detached.BOTTOM_LEFT_RIGHT,
				Detached.TOP_LEFT_RIGHT,
			]}
			onResize={() => {
				resizeObserver.set(resizeObserver.get() + 1);
			}}
			style={{
				display: 'flex',
				flexDirection: 'column',
			}}
		>
			<Anchor
				focused={preFocus.setter(val => {
					if (val) preFocus.set(true);
				})}
				{...anchor.props}
				ref={ref}
				style={{
					borderTopLeftRadius: expanded.map(f => f === Detached.TOP_LEFT_RIGHT ? 0 : null),
					borderTopRightRadius: expanded.map(f => f === Detached.TOP_LEFT_RIGHT ? 0 : null),
					borderBottomLeftRadius: expanded.map(f => f === Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
					borderBottomRightRadius: expanded.map(f => f === Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
					...anchor.props.style,
				}}
			>
				{anchor}
			</Anchor>

			<mark:popup>
				<Popup />
			</mark:popup>
		</Detached>;
	};

	return Attached;
});
