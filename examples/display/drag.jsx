import { Drag, Icon, Button, Paper, Theme, Shown } from 'destamatic-ui';
import { mount, OArray, Observer } from 'destam-dom';

const array = OArray([
	{text: 'hello 1'},
	{text: 'hello 2'},
	{text: 'hello 3'},
]);

const DraggedComponent = ({thing, dragging}) => {
	const dropdown = Observer.mutable(false);

	return <Paper onMouseDown={e => {
		e.preventDefault();
		dragging.set(e);
	}}>
		<Icon lib="feather" name="align-justify" />
		{thing.text}
		<Icon lib="feather" name="activity" onClick={() => dropdown.set(!dropdown.get())} />
		<Shown value={dropdown}>
			<div> My dropdown </div>
		</Shown>
	</Paper>
};

const MyDrag = () => {
	const dragging = Observer.mutable();

	return <Drag dragging={dragging} map={thing => <DraggedComponent thing={thing} dragging={dragging} /> }>{array}</Drag>
};

mount(document.body, <>
	<Theme value={{
		paper: {
			marginBottom: 5,
			marginTop: 5,
		},
	}}>
		<Button type="contained" onClick={() => {
			array.push({text: 'hello ' + (array.length + 1)});
		}}> Add more stuff </Button>
		<Button type="contained" onClick={() => {
			array.pop();
		}}> Remove last item </Button>
		<MyDrag />
		<MyDrag />
	</Theme>
</>);
