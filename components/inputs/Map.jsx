import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Observer } from 'destam-dom';

import Button from './Button.jsx';
import Icon from '../display/Icon.jsx';
import Theme from '../utils/Theme.jsx';
import Paper from '../display/Paper.jsx';
import ThemeContext from '../utils/ThemeContext.jsx';

Theme.define({
	map: {
		extends: 'radius',
		height: '100%',
		width: '100%',
		position: 'relative',
	},
	zoom: {
		position: 'absolute',
		top: 20,
		right: 20,
		display: 'flex',
		flexDirection: 'column',
		zIndex: 1000, // leaflet uses zIndex to render tiles, I'm so exausted trying to find a way around this, but this is the only way that will let you render something ontop of their god forsaken zindex based tiling system.
		// maybe we could create some kind of zIndex flattener that flattens all the elements of a Ref into their appropriate dom orders before rendering?
	},
});

const Zoom = ({ map }) => {
	const handleZoom = (delta) => {
		if (map.get()) {
			const currentZoom = map.get().getZoom();
			map.get().setZoom(currentZoom + delta);
		}
	};

	return <Paper theme="zoom" style={{ padding: 10, gap: 10, }}>
		<Button
			type="icon"
			icon={<Icon name="plus" size={20} />}
			onClick={() => handleZoom(1)}
		/>
		<Button
			type="icon"
			icon={<Icon name="minus" size={20} />}
			onClick={() => handleZoom(-1)}
		/>
	</Paper>;
};


// FIX: if location changes, map isn't updated.
export default ThemeContext.use(h => {
	const Map = ({ location = Observer.mutable({ lat: 0, lng: 0 }), askForLocation = false, style, }, cleanup, mounted) => {
		const Ref = <raw:div theme="map" />;
		const map = Observer.mutable(null);

		mounted(() => {
			let initialLocation = location.get();

			const renderMap = () => {
				const leafletMap = L.map(Ref, {
					attributionControl: false,
					zoomControl: false,
				}).setView(initialLocation, 13);

				map.set(leafletMap);

				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; OpenStreetMap contributors',
				}).addTo(leafletMap);

				const marker = L.marker(initialLocation).addTo(leafletMap);
				leafletMap.on('click', (e) => {
					const { lat, lng } = e.latlng;
					location.set({ lat, lng });
					marker.setLatLng([lat, lng]);
				});
			};

			if (navigator.geolocation && askForLocation) {
				navigator.geolocation.getCurrentPosition(
					(position) => {
						initialLocation = [position.coords.latitude, position.coords.longitude];
						location.set({ lat: initialLocation[0], lng: initialLocation[1] });
						queueMicrotask(renderMap);
					},
					(error) => {
						console.error("Geolocation error: ", error);
						queueMicrotask(renderMap);
					},
					{
						enableHighAccuracy: false,
						timeout: 10000,
						maximumAge: Infinity,
					}
				);
			} else {
				console.warn("Geolocation not supported on this browser.");
				queueMicrotask(renderMap);
			}

			cleanup(() => {
				if (map.get()) map.get().remove();
			});
		});

		return <div style={style}>
			<Ref theme='map' />
			<Zoom map={map} />
		</div>;
	};

	return Map;
});
