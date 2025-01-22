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
 * Creates a Typography element for rendering styled text with optional editing capabilities.
 *
 * - Inline editing if `editable` is `true` and the `label` is a mutable Observer.
 * - The `editable` parameter allows toggling between an editable field and a dynamically updating
 *   text element. Useful for scenarios where the text should update in real-time but remain non-editable.
 *
 * @function
 * @param {Object} options - Configuration options for the Typography element.
 * @param {string | string[]} [options.type='h1'] - The typography type (e.g., 'h1', 'h2', 'p1') and aditional styling (e.g., 'bold', 'italic', 'inline', 'center').
 * @param {string | Observer} [options.label=''] - The text content or an Observer wrapping it.
 * @param {boolean} [options.editable=false] - Controls whether the text can be edited.
 * @param {string[]} [options.children] - Nested text or elements inside the typography container.
 * @param {Object} [options.props] - Additional attributes for the container.
 * @returns {HTMLElement} The constructed Typography element.
 */
export default ThemeContext.use(h => {
	const Typography = ({ type = 'h1', label = '', editable = false, children, ...props }) => {
		if (!(editable instanceof Observer)) editable = Observer.mutable(editable);
		if (!(label instanceof Observer)) label = Observer.immutable(label);
		const isEditing = Observer.mutable(false);

		return <div
			onClick={(e) => {
				if (!label.isImmutable() && e.detail === 2) {
					isEditing.set(true);
				}
			}}
			{...props}
			theme={['typography', ...Array.isArray(type) ? type : type.split('_')]}
		>
			<Shown value={Observer.all([isEditing, editable]).map(([i, e]) => i && e)}>
				<mark:then>
					<TextField
						value={label}
						onBlur={() => isEditing.set(false)}
						onEnter={() => isEditing.set(false)}
					/>
				</mark:then>

				<mark:else>
					{children.length > 0 ? children : label ? label : null}
				</mark:else>
			</Shown>
		</div>;
	};
	return Typography;
});
