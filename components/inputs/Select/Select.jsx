import Observer from 'destam/Observer';

import Button from '../Button/Button.jsx';
import { mark } from '../../utils/h/h.jsx';
import Theme from '../../utils/Theme/Theme.jsx';
import { Icon } from '../../display/Icon/Icon.jsx';
import Attached from '../../utils/Attached/Attached.jsx';
import { Typography } from '../../display/Typography/Typography.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

import useAbort from '../../../util/abort.js';
import categories from '../../../util/categories.js';

Theme.define({
	select_popup: {
		boxShadow: 'none',
		background: '$invert($color_top)',
		color: '$color_top',
	},

	select_icon: {
		display: 'flex',
		justifyContent: 'right',
		marginLeft: 'auto',
		transition: 'transform 100ms ease-in-out',
		width: 25,
	},

	select_selectable: {
		width: '100%',
		boxSizing: 'border-box',
		overflow: 'clip',
		padding: 10,
		borderRadius: 0,
	},

	select_selected: {
		background: '$alpha($color_top, 0.2)',
	},

	select_selected_hovered: {
		background: '$alpha($color_top, 0.2)',
	},

	select_hovered: {
		background: '$alpha($color_top, 0.15)',
	},

	button_select_text_focused: {
		background: '$alpha($color_top, 0.1)',
	},

	button_select_contained_focused: {
		background: '$shiftBrightness($color, 0.1)',
	},

	button_select_outlined_focused: {
		background: '$alpha($color_top, 0.1)',
		borderColor: 'rgba(0, 0, 0, 0)',
	},
});

export default ThemeContext.use(h => {
	const Select = ({ value, options, display, style, type = 'text', placeholder = 'None', theme }) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(options instanceof Observer)) options = Observer.immutable(options);

		if (Array.isArray(display)) {
			let arr = display;
			display = a => arr[options.get().indexOf(a)];
		} else if (!display) display = a => a;

		const [preFocus, focused] = Observer.mutable(false).memo(2);
		const selector = value.selector('selected', null);
		const refPopup = <raw:div />;

		const Popup = (_, cleanup) => {
			// auto scroll to selected value on popup open
			queueMicrotask(() => {
				cleanup(value.effect(val => {
					let elem = refPopup.firstChild;

					while (elem) {
						if (elem.option === val) {
							let prevX = window.scrollX;
							let prevY = window.scrollY;

							elem.scrollIntoView();

							// hack: sometimes the above line will scroll the entire
							// page when it shouldn't. This completely breaks single
							// page apps.
							window.scroll(prevX, prevY);
							break;
						}
						elem = elem.nextSibling
					}
				}));
			});

			cleanup(useAbort(signal => {
				const currentKeys = [];

				// TODO: Fix search so it instead removes all options that don't match the search from the options array while remaining open.
				// Currently when the user is typing, it's a single key that selects the option instead of an aggregate string input.
				// focus should be placed simply on the top option in the list while the search happens.
				// enter/space select the items from options (as handled already).
				// arrow keys still allow user to move focus up/down list of searched options.

				window.addEventListener('keydown', e => {
					if (!options.get().length) return;

					if (e.key === 'ArrowUp') {
						let index = options.get().indexOf(value.get());
						if (index === -1) {
							index = options.length - 1;
						} else if (index !== 0) {
							index--;
						} else {
							return;
						}

						value.set(options.get()[index]);
					} else if (e.key === 'ArrowDown') {
						let index = options.get().indexOf(value.get());
						if (index === -1) {
							index = 0;
						} else if (index !== options.get().length - 1) {
							index++;
						} else {
							return;
						}

						value.set(options.get()[index]);
					} else if (e.key === 'Enter') {
						focused.set(false);
					} else if (e.key.length === 1) {
						const key = e.key;
						// advance existing keys
						for (let i = 0; i < currentKeys.length; i++) {
							const search = currentKeys[i];
							if (search.str[++search.i] !== key) {
								currentKeys.splice(i--, 1);
							}
						}

						const ne = [];

						// search and add strings
						// TODO: Fix non latin languages
						for (const option of options.get()) {
							let str = display(option);
							if (str instanceof Observer) str = str.get();
							str = str.toString().toLowerCase();

							for (let i = 0; i < str.length; i++) {
								if (str[i] === key) {
									ne.push({ str, i, option });
								}
							}
						}

						currentKeys.push(...ne.sort((a, b) => a.i - b.i));
						if (currentKeys.length) value.set(currentKeys[0].option);
					}

					e.preventDefault();
				}, { signal });
			})());

			return <Selectable each={options} />
		};

		const Selectable = ({ each: option }) => {
			return <Button
				$option={option}
				focused={Observer.immutable(false)}
				type={[
					'select_selectable',
					selector(option)
				]}
				onMouseDown={e => {
					e.preventDefault()
					if (!value.isImmutable()) value.set(option);
					focused.set(false);
				}}
			>
				{display(option)}
			</Button>;
		};

		return <Attached
			Anchor={Button}
			anchorTheme='button'
			focused={preFocus}
			type='select'
		>
			<mark:anchor
				type={['select', 'base', type]}
				onMouseDown={e => {
					e.preventDefault();
					console.log("MOUSE DOWN!");
					focused.set(!focused.get());
				}}
				style={style}
			>
				<Typography type='p1'>
					{value.map(val => {
						if (options.get().includes(val)) {
							return display(val);
						} else {
							return placeholder;
						}
					})}
				</Typography>
				<div theme="select_icon">
					<Icon
						name='chevron-down'
						size={16}
						rot={focused.bool(180, 0)}
					/>
				</div>
			</mark:anchor>

			<mark:popup ref={refPopup}>
				<Popup />
			</mark:popup>
		</Attached>;
	};

	return Select;
});
