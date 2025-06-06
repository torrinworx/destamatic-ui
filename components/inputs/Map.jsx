// Note: since this file depends on an external/optional library to display the map, it needs to be directly rather than through the index.js.

import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

import { Observer } from 'destam-dom';

import Button from './Button';
import Theme from '../utils/Theme';
import Icon from '../display/Icon';
import ThemeContext from '../utils/ThemeContext';

Theme.define({
	map: {
		height: '400px',
		width: '100%',
		borderRadius: '10px',
		overflow: 'hidden',
	},
});

// TODO: Possible to use our own custom buttons inside the map itself (not off to the side)? in place of the default ones?
const Zoom = () => {
	return <div theme='row'>
		<Button type='icon' icon={<Icon name='plus' size={20} onClick={() => { }} />} />
		<Button type='icon' icon={<Icon name='minus' size={20} onClick={() => { }} />} />
	</div>
}

export default ThemeContext.use(h => {
	const Map = ({ location = Observer.mutable({ lat: 0, lng: 0 }) }, cleanup, mounted) => {
		const Ref = <raw:div />;

		location.watch(() => console.log(location.get()));

		mounted(() => {
			let map;
			let initialLocation = [0, 0];

			if (navigator.geolocation) {
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
					// Have these option params?
					{
						enableHighAccuracy: false,
						timeout: 5000,
						maximumAge: Infinity,
					}
				);
			} else {
				console.warn("Geolocation is not supported by this browser.");
				queueMicrotask(renderMap);
			}

			const renderMap = () => {
				map = L.map(Ref, { attributionControl: false }).setView(initialLocation, 13);

				L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
					attribution: '&copy; OpenStreetMap contributors',
				}).addTo(map);

				const marker = L.marker(initialLocation).addTo(map);

				map.on('click', (e) => {
					const { lat, lng } = e.latlng;
					location.set({ lat, lng });
					marker.setLatLng([lat, lng]);
				});
			};

			cleanup(() => {
				if (map) map.remove();
			});
		});

		return <Ref
			style={{
				height: '400px',
				width: '100%',
			}}
			theme="map"
		/>;
	};

	return Map;
});
