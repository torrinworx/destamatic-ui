import { Observer, OArray } from 'destam';

import createContext from '../../utils/Context/Context.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';

const parser = new DOMParser();

/**
 * Icons context is used to manage and resolve icon resources.
 * It allows for the combination of multiple icon packs and supports asynchronous resolution of icons by name.
 *
 * @returns {Function} A function to resolve an icon by name from the registered icon packs.
 *
 * @param {Array|Function} next - The next icon pack(s) to register. It can be a single icon pack function, an array of such functions,
 * or an object where each key is an icon name and the value is the SVG string or component.
 * 
 * @param {Function} prev - The previously registered icon pack function, used to fallback in icon resolution.
 * 
 * This context modifies the icon pack to prepend the newly added pack(s) to the existing list of packs,
 * hence allowing orderly fallback mechanisms until the icon is resolved.
 */
export const Icons = createContext(() => null, (next, prev) => {
	if (!Array.isArray(next)) next = [next];

	next = next.map(pack => {
		// if the pack is not a function (we expect it to be an object in this case)
		// convert it into the function representation.
		if (typeof pack !== 'function') {
			return iconName => pack[iconName];
		}

		return pack;
	});

	// slot in the prev icon pack
	next.splice(0, 0, prev);

	// combine all the icon packs
	return async name => {
		for (let i = next.length - 1; i >= 0; i--) {
			const icon = await next[i](name);
			if (icon) return icon;
		}

		return null;
	};
});

/**
 * Icon component capable of rendering SVG icons based on the icon pack context.
 *
 * @param {Object} props - The properties object.
 * @param {string|Observer<string>} props.name - The name of the icon to render. Can be a literal string or an Observer.
 * @param {number|Observer<number>} [props.size=24] - The size of the icon. Can be a number or an Observer, and determines the width and height of the SVG element.
 * @param {HTMLElement} [props.ref] - A reference to the DOM element of the icon. If not provided, a default SVG element is created.
 * @param {Object} [props.style] - Custom styles to apply to the icon.
 * @param {...Object} props - Additional properties to spread onto the SVG element representing the icon.
 * @param {Function} cleanup - Function to handle cleanup operations when properties change.
 * 
 * @returns {JSX.Element} The rendered SVG icon element.
 */
export const Icon = Icons.use(iconPack => ThemeContext.use(svg => {
	return ({ name, size = null, style = {}, rot, ...props }, cleanup) => {
		if (!(name instanceof Observer)) name = Observer.immutable(name);
		if (!(size instanceof Observer)) size = Observer.immutable(size);
		const ref = Observer.mutable(null);

		const oldIconAttrs = []; // non-parent attributes, to remove on name change
		const libClass = Observer.mutable('');
		const children = OArray();

		if (rot) {
			style.transition = 'transform 100ms';
			style.transform = Observer.immutable(rot).map(rot => `rotate(${rot}deg)`);
		}

		cleanup(name.effect(iconName => {
			Promise.resolve(iconPack(iconName)).then(svg => {
				const svgRef = ref.get();

				// remove all the old attributes
				for (const name of oldIconAttrs.splice(0, oldIconAttrs.length)) {
					svgRef.removeAttribute(name);
				}

				// clear the svg from all children so that we can append our new children
				children.splice(0, children.length);

				if (!svg) {
					svgRef.style.display = 'none';
					return;
				} else {
					svgRef.style.display = 'block';
				}

				if (typeof svg === 'string') {
					svg = parser.parseFromString(svg, 'image/svg+xml').children[0];
				} else {
					svg = svg.cloneNode(true);
				}

				for (let i = 0; i < svg.attributes.length; i++) {
					const attr = svg.attributes[i];
					if (attr.nodeName === 'class') {
						libClass.set(attr.nodeValue);
					} else {
						oldIconAttrs.push(attr.nodeName); // track it so we can remove it next load() call
						svgRef.setAttribute(attr.nodeName, attr.nodeValue);
					}
				}

				// append the children of the parsed svg
				while (svg.firstElementChild) {
					const child = svg.firstElementChild;
					svg.removeChild(child)
					children.push(child);
				}
			});
		}));

		return <svg:svg ref={ref}
			aria-label={`Icon: ${name}`}
			class={libClass}
			style={{ width: size, height: size, ...style }}
			{...props}
			theme="icon"
		>
			{children}
		</svg:svg>;
	};
}, 'http://www.w3.org/2000/svg'));

export default Icon;
