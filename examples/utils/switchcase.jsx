import { mount, Observer} from 'destam-dom';
import { SwitchCase, Button } from 'destamatic-ui';

const value = Observer.mutable('red');

mount(document.body, <>
	<SwitchCase value={value} >
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
    </SwitchCase>

	<Button label="click me" type='contained' style={{backgroundColor: 'green'}} onClick={() => value.set('green')} />
	<Button label="no me" type='outlined' style={{backgroundColor: 'blue'}}  onClick={() => value.set('blue')} />
	<Button label="meeeee" type='outlined' style={{backgroundColor: 'pink'}}  onClick={() => value.set('pink')} />
</>);
