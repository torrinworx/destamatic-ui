import {h, OArray, Observer, mount} from 'destam-dom';

export const popups = OArray();

const Popup = ({children, style, placement, ref: Ref}, cleanup) => {
	if (!Ref) {
		Ref = <div />;
	}

	if (!(placement instanceof Observer)) {
		placement = Observer.immutable(placement);
	};

	const dom = <Ref $style={{
		position: 'absolute',
		left: placement.map(p => p?.left + 'px'),
		top: placement.map(p => p?.top + 'px'),
		right: placement.map(p => p?.right + 'px'),
		bottom: placement.map(p => p?.bottom + 'px'),
		...style
	}}>
		{children}
	</Ref>;

	popups.push(dom);

	cleanup(() => {
		const index = popups.indexOf(dom);
		if (index >= 0) popups.splice(index, 1);
	});

	return null;
};

export default Popup;
