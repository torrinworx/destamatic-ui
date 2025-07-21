import { mark } from '../utils/h';
import ThemeContext from '../utils/ThemeContext';
import Theme from '../utils/Theme';
import useAbort from '../../util/abort';
import Observer from 'destam/Observer';
import Detached from '../utils/Detached';

import categories from '../../util/categories';

export default ThemeContext.use(h => {
	const Attached = ({children, focused, Anchor, anchorTheme, type, theme}) => {
		const [popup, anchor] = categories(children, ['popup', 'anchor'], 'anchor');
		const [preFocus, postFocus] = focused.memo(2);

		const ref = anchor.props.ref ?? <raw:button />;
		const Paper = popup.props.ref ?? <raw:div />;

		const resizeObserver = Observer.mutable(0);

		const Popup = Theme.use(themer => (_, cleanup) => {
			const radius = themer(theme, anchorTheme, type).vars('radius');
			const style = resizeObserver.map(() => getComputedStyle(ref));

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
					borderRadius: Observer.all([postFocus, radius]).map(([f, r]) => {
						if (f === Detached.TOP_LEFT_RIGHT) {
							return `${r} ${r} 0px 0px`;
						} else if (f === Detached.BOTTOM_LEFT_RIGHT) {
							return `0px 0px ${r} ${r}`;
						} else {
							return null;
						}
					}),
					clipPath: Observer.all([postFocus, radius]).map(([f, r]) => {
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
			enabled={postFocus}
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
				focused={preFocus}
				{...anchor.props}
				ref={ref}
				style={{
					borderTopLeftRadius: postFocus.map(f => f === Detached.TOP_LEFT_RIGHT ? 0 : null),
					borderTopRightRadius: postFocus.map(f => f === Detached.TOP_LEFT_RIGHT ? 0 : null),
					borderBottomLeftRadius: postFocus.map(f => f === Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
					borderBottomRightRadius: postFocus.map(f => f === Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
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