import { mount, Observer} from 'destam-dom';
import { Switch, Button, Toggle } from 'destamatic-ui';

const value = Observer.mutable('red');

const one = Observer.mutable(false);
const two = Observer.mutable(false);
const three = Observer.mutable(false);

mount(document.body, <>
	<Switch value={value} >
		<mark:case value='blue'>
			<h1>you clicked the blue color</h1>
		</mark:case>
		<mark:case value='green'>
			<p>green green green</p>
		</mark:case>
		<mark:case value='pink'>
			<p style={{color: 'pink'}}>wooooo</p>
		</mark:case>
		<mark:default>
			<h3>im not blue green or pink</h3>
		</mark:default>
	</Switch>

	<Button label="click me" type='contained' style={{backgroundColor: 'green'}} onClick={() => value.set('green')} />
	<Button label="no me" type='outlined' style={{backgroundColor: 'blue'}}  onClick={() => value.set('blue')} />
	<Button label="meeeee" type='outlined' style={{backgroundColor: 'pink'}}  onClick={() => value.set('pink')} />

	<Toggle value={one} />
	<Toggle value={two} />
	<Toggle value={three} />

	<Switch cases={{one, two, three}}>
		<mark:case value='one'>
			The first toggle is on and trumps the state of all the others defined later
		</mark:case>
		<mark:case value='two'>
			The second toggle is on and the first toggle is off
		</mark:case>
		<mark:case value='three'>
			The first toggle is off, the second toggle is off, and the third toggle is on.
		</mark:case>
		<mark:default>
			No toggles are switched
		</mark:default>
    </Switch>
</>);
