import { mark } from '../utils/h';
import Observer from 'destam/Observer';
import Typography from '../display/Typography';
import { Icon } from '../display/Icon';
import Paper from '../display/Paper';
import Theme from '../utils/Theme';
import ThemeContext from '../utils/ThemeContext';
import Detached from '../utils/Detached';
import Button from '../inputs/Button';
import useAbort from '../../util/abort';

Theme.define({
	select_paper: {
		boxShadow: 'none',
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
	const Select = ({ value, options, display, style, type = 'text', placeholder = 'None' }, cleanup, mounted) => {
		if (!(value instanceof Observer)) value = Observer.immutable(value);
		if (!(options instanceof Observer)) options = Observer.immutable(options);

		if (Array.isArray(display)) {
			let arr = display;
			display = a => arr[options.get().indexOf(a)];
		} else if (!display) {
			display = a => a;
		}

		const [preFocus, focused] = Observer.mutable(false).memo(2);
		const selector = value.selector('selected', null);

		const buttonRef = <raw:button />;

		const Popup = Theme.use(themer => (_, cleanup, mounted) => {
			const paper = <raw:div />;
			const Selectable = ({ each: option }) => {
				return <Button
					$option={option}
					focused={Observer.immutable(false)}
					type={[
						'select_selectable',
						selector(option)
					]}
					onMouseDown={e => e.preventDefault()}
					onMouseUp={e => {
						value.set(option);
						focused.set(false);
					}}
				>
					{display(option)}
				</Button>;
			};

			// auto scroll to selected value on popup open
			queueMicrotask(() => {
				cleanup(value.effect(val => {
					let elem = paper.firstChild;

					while (elem) {
						if (elem.key === val) {
							elem.scrollIntoView();
							break;
						}
						elem = elem.nextSibling
					}
				}));
			});

			const radius = Observer.immutable('50px'); //themer(theme, 'select').vars('radius');
			const style = getComputedStyle(buttonRef);

			const foc = Observer.mutable(false);

			cleanup(useAbort(signal => {
				requestAnimationFrame(() => {
					foc.set(true);
				}, { signal });

				const currentKeys = [];

				// two issues: if the placeholder is selected then arrow keys brick the dropdown and the arrow keys automatically close the dropdown
				// arrow keys are for navigating not for selecting, Enter/Space should be for selecting the value.
				// Some how focused/prefocus is getting set to false on key down, not value update, something is watching keydown and triggering `focused`
				// to be set to false.

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
					} else if (e.key === 'Escape') {
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

						// search and add strings
						// TODO: Fix non latin languages
						for (const option of options.get()) {
							let str = display(option);
							if (str instanceof Observer) str = str.get();
							str = str.toString();

							for (let i = 0; i < str.length; i++) {
								if (str[i] === key) {
									currentKeys.push({ str, i, option });
								}
							}
						}

						if (currentKeys.length) value.set(currentKeys[0].option);
					}
				}, { signal });
			})());

			return <Paper
			ref={paper}
			tight
			theme='select'
			type={foc.map(f => f ? 'focused' : null)}
			style={{
				width: style.width,
				overflow: 'auto',
				borderTopLeftRadius: focused.map(f => f !== Detached.TOP_LEFT_RIGHT ? 0 : null),
				borderTopRightRadius: focused.map(f => f !== Detached.TOP_LEFT_RIGHT ? 0 : null),
				borderBottomLeftRadius: focused.map(f => f !== Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
				borderBottomRightRadius: focused.map(f => f !== Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
				clipPath: Observer.all([focused, radius]).map(([f, r]) => {
					if (f === Detached.TOP_LEFT_RIGHT) {
						return `inset(-${r} -${r} 0px -${r})`;
					} else if (f === Detached.BOTTOM_LEFT_RIGHT) {
						return `inset(0px -${r} -${r} -${r})`;
					} else {
						return null;
					}
				}),
			}}>
				<Selectable each={options} />
			</Paper>
		});

		return <Detached
			enabled={focused}
			locations={[
				Detached.BOTTOM_LEFT_RIGHT,
				Detached.TOP_LEFT_RIGHT,
			]}
		>
			<Button
				type={['select', 'base', type]}
				ref={buttonRef}
				onMouseDown={e => {
					e.preventDefault();
					focused.set(!focused.get());
				}}
				focused={preFocus}
				style={{
					borderTopLeftRadius: focused.map(f => f === Detached.TOP_LEFT_RIGHT ? 0 : null),
					borderTopRightRadius: focused.map(f => f === Detached.TOP_LEFT_RIGHT ? 0 : null),
					borderBottomLeftRadius: focused.map(f => f === Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
					borderBottomRightRadius: focused.map(f => f === Detached.BOTTOM_LEFT_RIGHT ? 0 : null),
					...style,
				}}
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
				<Icon
					name='chevron-down'
					size={16}
					style={{
						marginLeft: 'auto',
						transform: focused.map(f => f ? 'rotate(180deg)' : null),
						transition: 'transform 100ms ease-in-out',
					}}
				/>
			</Button>

			<mark:popup>
				<Popup />
			</mark:popup>
		</Detached>;
	};

	return Select;
});
