import { h, svg } from './h';
import { Observer, OObject } from 'destam-dom';

/**
 * Asynchronous function to load icons from various libraries.
 * - Currently supports Feather Icons.
 *
 * @param {string} libraryName - The name of the icon library.
 * @param {string} iconName - The name of the icon to load from the library.
 * @param {Object} style - The style object to apply to the SVG element.
 * @returns {Promise<string>} - A promise that resolves to the SVG string of the icon.
 */
const loadIcon = async (libraryName, iconName, style) => {
    switch (libraryName) {
        case 'feather':
            try {
                const feather = await import('feather-icons');
                if (feather.icons[iconName]) {
                    return feather.icons[iconName].toSvg({ ...style });
                }
                throw new Error(`Icon ${iconName} not found in ${libraryName}.`);
            } catch (error) {
                // Handling failure of dynamic import or icon not found
                console.error(error.message);
                throw new Error(`Failed to load ${libraryName} or icon ${iconName} not found.`);
            }
        // Cases for other icon libraries can be added here
        default:
            throw new Error(`The library ${libraryName} is not supported.`);
    }
}

/**
 * Icon component that dynamically loads and renders an SVG icon from a specified library.
 * 
 * Uses an asynchronous function to fetch the SVG content of the icon.
 * 
 * @param {Object} props - The properties object.
 * @param {string} props.libraryName - The name of the icon library (e.g., 'feather').
 * @param {string} props.iconName - The name of the icon to load from the library.
 * @param {string} [props.size='20'] - The size of the icon.
 * @param {Object} [props.style] - Custom styles to apply to the icon's wrapper element.
 * @param {...Object} [props] - Additional properties to spread onto the icon's wrapper element.
 * 
 * @returns {JSX.Element} The rendered icon element.
 */
const Icon = ({
    lib,
    libraryName,
    name,
    iconName,
    size='20',
    style,
    ref: Ref,
    ...props
}) => {
    if (!Ref) Ref = <svg:svg />;

    const svgChildren = Observer.mutable(null);
    const svgProps = OObject();

    const styleObject = { marginTop: '4px', height: size, width: size, ...style };

    loadIcon(lib ?? libraryName, name ?? iconName, styleObject)
        .then(svgContent => {
            const parser = new DOMParser();
            const svg = parser.parseFromString(svgContent, 'image/svg+xml').children[0];

            for (let i = 0; i < svg.attributes.length; i++) {
                const attr = svg.attributes[i];
                Ref.setAttribute(attr.nodeName, attr.nodeValue);
            }

            while (svg.firstElementChild) {
                Ref.appendChild(svg.firstElementChild);
            }
        })
        .catch(error => {
            console.error(error.message);
        });

    return <Ref
        style={{ display: 'inline-block', ...style }}
        {...props}
    />;
};

export default Icon;
