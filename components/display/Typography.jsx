import { Observer } from 'destam';

import { mark } from '../utils/h';
import Theme from '../utils/Theme';
import Shown from '../utils/Shown';
import TextField from '../inputs/TextField';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	typography: { display: 'flex' },
	typography_h1: { fontSize: 62, textWrap: 'nowrap' },
	typography_h2: { fontSize: 56, textWrap: 'nowrap' },
	typography_h3: { fontSize: 36, textWrap: 'nowrap' },
	typography_h4: { fontSize: 30, textWrap: 'nowrap' },
	typography_h5: { fontSize: 24, textWrap: 'nowrap' },
	typography_h6: { fontSize: 20, textWrap: 'nowrap' },
	typography_p1: { fontSize: 16 },
	typography_p2: { fontSize: 14 },
	typography_regular: { fontStyle: 'normal' },
	typography_bold: { fontWeight: 'bold' },
	typography_italic: { fontStyle: 'italic' },
	typography_center: { textAlign: 'center' },
	typography_inline: { display: 'inline-flex' }
});

/**
 * Typography component for rendering text with different styles and types.
 * Enables inline editing when double-clicked, if the label is a mutable Observer.
 */
export default ThemeContext.use(h => {
	const Typography = ({ type = 'h1', label = '', children, ...props }) => {
		if (!(label instanceof Observer)) label = Observer.immutable(label);
		const isEditing = Observer.mutable(false);

		return <div
			onClick={(e) => {
				if (!label.isImmutable() && e.detail === 2) {
					isEditing.set(true);
				}
			}}
		>
			<Shown value={isEditing}>
				<mark:then>
					<TextField
						value={label}
						onBlur={() => isEditing.set(false)}
						onEnter={() => isEditing.set(false)}
					/>
				</mark:then>

				<mark:else>
					<div
						{...props}
						theme={['typography', ...Array.isArray(type) ? type : type.split('_')]}
					>
						{children.length > 0 ? children : label ? label : null}
					</div>
				</mark:else>
			</Shown>
		</div>;
	};
	return Typography;
});
