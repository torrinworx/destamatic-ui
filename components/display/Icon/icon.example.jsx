import { Typography, Icon, } from 'destamatic-ui';

const Example = () => {
	const libraryLabels = {
		feather: 'Feather Icons',
		lineicons: 'Line Icons',
		tabler: 'Tabler Icons',
		simpleIcons: 'Simple Icons',
	};

	const iconExamples = {
		feather: [
			{ name: 'home', label: 'home' },
			{ name: 'camera', label: 'camera' },
			{ name: 'search', label: 'search' },
			{ name: 'heart', label: 'heart' },
			{ name: 'settings', label: 'settings' },
			{ name: 'user', label: 'user' },
		],
		simpleIcons: [
			{ name: 'linux', label: 'Linux' },
			{ name: 'npm', label: 'npm' },
			{ name: 'html5', label: 'HTML5' },
			{ name: 'github', label: 'GitHub' },
			{ name: 'vite', label: 'Vite' },
			{ name: 'javascript', label: 'JavaScript' },
		],
		lineicons: [
			{ name: 'home', label: 'home' },
			{ name: 'camera', label: 'camera' },
			{ name: 'search', label: 'search' },
			{ name: 'heart', label: 'heart' },
			{ name: 'cog', label: 'cog' },
			{ name: 'user', label: 'user' },
		],
		tabler: [
			{ name: 'home', label: 'home' },
			{ name: 'camera', label: 'camera' },
			{ name: 'search', label: 'search' },
			{ name: 'heart', label: 'heart' },
			{ name: 'settings', label: 'settings' },
			{ name: 'user', label: 'user' },
		],
	};

	return <div
		theme="column_fill_center"
		style={{ padding: 16, gap: 24, alignItems: 'stretch' }}
	>
		{Object.keys(libraryLabels).map((libKey) => {
			const icons = iconExamples[libKey];
			if (!icons || !icons.length) return null;

			return <div
				key={libKey}
				theme="column_fill_center"
				style={{ gap: 12 }}
			>
				<Typography
					type="h2"
					label={libraryLabels[libKey] ?? libKey}
				/>
				<div
					theme="row"
					style={{
						gap: 20,
						flexWrap: 'wrap',
						alignItems: 'center',
					}}
				>
					{icons.map((icon) => (
						<div
							key={icon.name}
							theme="column_center"
							style={{ gap: 8, minWidth: 80 }}
						>
							<Icon
								name={`${libKey}:${icon.name}`}
								size={50}
								style={{
									fill: 'none',
									color: '$color_top',
								}}
							/>
							<Typography
								type="p2"
								label={icon.label}
							/>
						</div>
					))}
				</div>
			</div>;
		})}
	</div>;
}

export default {
	example: Example,
	header: 'Icon',
}
