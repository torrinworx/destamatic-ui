import { OArray, OObject, Observer } from 'destam-dom';

import { h } from '../../utils/h/h.jsx';
import Icon from '../../display/Icon/Icon.jsx';
import Theme from '../../utils/Theme/Theme.jsx';
import Shown from '../../utils/Shown/Shown.jsx';
import Paper from '../../display/Paper/Paper.jsx';
import Button from '../../inputs/Button/Button.jsx';
import Context from '../../utils/Context/Context.jsx';
import LoadingDots from '../../utils/LoadingDots/LoadingDots.jsx';
import { Typography } from '../../display/Typography/Typography.jsx';
import ThemeContext from '../../utils/ThemeContext/ThemeContext.jsx';


// File selection dialogue.
const selectFile = (extensions, multiple = true) => new Promise((ok) => {
	let input = document.createElement('input');
	input.click();
	if (extensions) input.accept = extensions;
	input.multiple = multiple;

	input.type = 'file';
	input.onchange = e => {
		ok(e.target);
	};
	input.click();
});

Theme.define({
	fileDrop_base: {
		extends: 'primary_radius',
		$borderSize: '2px',
		border: '$borderSize solid rgba(0, 0, 0, 0)',
	},

	fileDrop_base_empty: {
		display: 'flex',
		border: '$borderSize $color dashed',
		justifyContent: 'center',
		padding: 10,
	},

	fileDrop_base_clickable: {
		cursor: 'pointer',
	},

	fileDrop_base_dropping: {
		border: '$borderSize solid $color',
	},

	paper_fileDrop: {
		margin: 5,
		display: 'flex',
		flexDirection: 'row',
		alignItems: 'center',
	},

	typography_fileDrop: {
		extends: "typography_p1",
		marginRight: 10,
		marginLeft: 10,
	},
});

const FileDropContext = Context(null);

const Listing = FileDropContext.use(({ files }) => () => {
	const File = ({ each: file }) => {
		return <Paper type='fileDrop'>
			<Icon name="feather:file" style={{ margin: 10 }} />
			<Typography type="fileDrop_expand" label={file.observer.path('name')} />
			{file.observer.path('status').map(status => {
				if (status === 'loading') {
					return <LoadingDots />;
				} else if (status === 'error') {
					return file.observer.path('error');
				}/* else if (status === 'ready') {
					return file.observer.path('loadingResult').map(e => e ?? null);
				}*/

				return null;
			}).unwrap()}
			<Button onClick={event => {
				event.stopPropagation();

				const i = files.indexOf(file);
				files.splice(i, 1);
			}}>
				<Icon name="feather:x" />
			</Button>
		</Paper>
	};

	return <File each={files} />;
});

const UploadButton = FileDropContext.use(({ files, handleFiles, extensions, multiple }) => props => {
	return <Button {...props} onClick={event => {
		if (props.onClick) props.onClick(event);

		selectFile(extensions, multiple).then(handleFiles);
	}} />;
});

const FileDrop = ThemeContext.use(h => {
	const FileDrop = ({
		files,
		children,
		onDrop,
		onClick,
		extensions = [],
		multiple,
		loader,
		limit,
		theme,
		clickable = true,
		ready,
		...props
	}, cleanup, mounted) => {
		if (!files) files = OArray();
		const isEmpty = files.observer.shallow(1).map(files => files.length === 0);
		const dropping = Observer.mutable(false);
		const Div = <raw:div />;

		let droppingRefs = 0;

		if (!children.length) children = <>
			<Shown value={isEmpty}>
				<div style={{
					textAlign: 'center',
				}}>
					<Icon name='download' style={{ color: '$color' }} />
					<div style={{ padding: 10 }}>Drop your file here or <span theme={theme} style={{ color: '$color' }}>browse</span></div>
					<Shown value={extensions.length}>
						<Typography type='p12_subtext' label={"Supports: " + extensions.join(', ')} />
					</Shown>
				</div>
			</Shown>
			<Listing />
		</>;

		if (ready) {
			cleanup(files.observer.skip().path('status').effect(() => {
				const readyFiles = [];
				for (const file of files) {
					if (file.status === 'ready') {
						readyFiles.push(file.result);
					} else {
						ready.set(null);
						return;
					}
				}

				if (readyFiles.length === 0) {
					ready.set(null);
				} else if (multiple) {
					ready.set(readyFiles);
				} else {
					ready.set(readyFiles[0]);
				}
			}));
		}

		const handleFiles = (data) => {
			const addFiles = [];
			if (data.items) {
				for (let i = 0; i < data.items.length; i++) {
					const item = data.items[i];

					if (item.kind === 'file') {
						addFiles.push(item.getAsFile());
					}
				}
			} else {
				for (let i = 0; i < data.files.length; i++) {
					addFiles.push(data.files[i]);
				}
			}

			if (addFiles.length === 0) {
				return;
			}

			if (!multiple) {
				files.splice(0, files.length);
				addFiles.splice(1, addFiles.length);
			}

			for (const file of addFiles) {
				if (limit && file.size > limit) {
					files.push(OObject({
						name: file.name,
						error: "This file is too large",
						status: 'error',
						file,
					}));
				} else {
					const fileObj = OObject({
						name: file.name,
						status: 'ready',
						file,
					});

					if (loader) {
						fileObj.status = 'loading';
						const load = loader(file, fileObj);
						if (!load) {
							continue;
						}

						Promise.resolve(load).then(res => {
							fileObj.result = res;
							fileObj.status = 'ready';
						}, res => {
							fileObj.error = res;
							fileObj.status = 'error';
						});
					} else {
						fileObj.result = file;
					}

					files.push(fileObj);
				}
			}
		};

		return <Div
			{...props}
			draggable
			theme={[
				'fileDrop',
				'base',
				clickable ? 'clickable' : null,
				isEmpty.map(e => e ? 'empty' : null),
				dropping.map(e => e ? 'dropping' : null),
			]}
			onDragenter={event => {
				if (droppingRefs === 0) {
					dropping.set(true);
				}

				droppingRefs++;
			}}
			onDragleave={event => {
				if (droppingRefs > 0) {
					droppingRefs--;
				}

				if (droppingRefs === 0) {
					dropping.set(false);
				}
			}}
			onDragover={event => {
				event.preventDefault();
			}}
			onDrop={event => {
				if (onDrop) {
					onDrop(event);
				} else {
					event.preventDefault();
				}

				handleFiles(event.dataTransfer);

				dropping.set(false);
				droppingRefs = 0;
			}}
			onClick={event => {
				if (onClick) onClick(event);
				if (!clickable) return;

				selectFile(extensions, multiple).then(handleFiles);
			}}
		>
			<FileDropContext value={{ files, handleFiles, extensions, multiple }}>
				{children}
			</FileDropContext>
		</Div>;
	};

	return FileDrop;
});

FileDrop.Listing = Listing;
FileDrop.Button = UploadButton;

export default FileDrop;
