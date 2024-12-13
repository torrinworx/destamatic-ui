import { Scroll, Button } from 'destamatic-ui';
import { Observer, mount } from 'destam-dom';

const width = Observer.mutable(100);
const height = Observer.mutable(100);

mount(document.body, <>
	<div theme="center" style={{position: 'absolute', inset: 0}}>
		<Scroll style={{width: 500, height: 500}}>
			<div style={{
				width,
				height,
				background: 'linear-gradient(to bottom right, red, green)'
			}} />
		    <p>
				Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod
				tempor incididunt ut labore et dolore magna aliqua. Feugiat sed lectus
				vestibulum mattis. Id consectetur purus ut faucibus pulvinar elementum
				integer enim neque. Metus vulputate eu scelerisque felis imperdiet. Massa
				massa ultricies mi quis hendrerit dolor magna eget est. Rhoncus aenean vel
				elit scelerisque mauris pellentesque. Volutpat est velit egestas dui id
				ornare arcu. Id cursus metus aliquam eleifend mi in. Condimentum lacinia
				quis vel eros donec ac. Feugiat pretium nibh ipsum consequat nisl vel
				pretium lectus.
			</p>
			<p>
				Sit amet volutpat consequat mauris nunc congue nisi vitae. Viverra
				accumsan in nisl nisi scelerisque. Enim ut tellus elementum sagittis
				vitae. Dolor sed viverra ipsum nunc aliquet bibendum enim facilisis. Nisi
				scelerisque eu ultrices vitae. Sem fringilla ut morbi tincidunt augue
				interdum velit. Senectus et netus et malesuada fames ac turpis egestas.
				Nunc non blandit massa enim nec. At augue eget arcu dictum varius duis at.
				Dictumst quisque sagittis purus sit amet. Ut eu sem integer vitae justo.
				Mollis aliquam ut porttitor leo a diam sollicitudin. Mollis nunc sed id
				semper risus in. Eu volutpat odio facilisis mauris sit. Augue interdum
				velit euismod in pellentesque massa placerat duis. Aliquam faucibus purus
				in massa tempor nec feugiat. Nisl rhoncus mattis rhoncus urna neque
				viverra justo. Leo duis ut diam quam nulla. Ultrices dui sapien eget mi
				proin sed libero enim.
			</p>
			<p>
				Cras adipiscing enim eu turpis egestas. Est ultricies integer quis auctor
				elit. Tempor id eu nisl nunc mi ipsum. Non nisi est sit amet facilisis.
				Nisl suscipit adipiscing bibendum est ultricies integer quis. Habitant
				morbi tristique senectus et netus et malesuada. Etiam erat velit
				scelerisque in dictum non consectetur a erat. Diam sollicitudin tempor id
				eu nisl. Aenean vel elit scelerisque mauris pellentesque pulvinar
				pellentesque habitant. A pellentesque sit amet porttitor. Viverra aliquet
				eget sit amet tellus cras. Eu ultrices vitae auctor eu.
			</p>
			<p>
				Fames ac turpis egestas sed tempus. Id donec ultrices tincidunt arcu non
				sodales. Congue mauris rhoncus aenean vel elit scelerisque mauris
				pellentesque. Velit scelerisque in dictum non consectetur a erat nam.
				Auctor elit sed vulputate mi sit amet mauris commodo. Mauris ultrices eros
				in cursus turpis massa tincidunt. Dui sapien eget mi proin sed libero enim
				sed faucibus. Ipsum dolor sit amet consectetur adipiscing elit
				pellentesque habitant. Amet massa vitae tortor condimentum. Feugiat nisl
				pretium fusce id velit. Malesuada proin libero nunc consequat interdum
				varius sit. Quam nulla porttitor massa id neque aliquam vestibulum morbi
				blandit. Gravida arcu ac tortor dignissim convallis aenean et tortor at.
				Dapibus ultrices in iaculis nunc sed. Fermentum et sollicitudin ac orci
				phasellus egestas tellus. Proin libero nunc consequat interdum varius sit
				amet mattis. Sed viverra ipsum nunc aliquet bibendum.
			</p>
		</Scroll>
	</div>
	<Button onClick={() => width.set(width.get() + 200)}>Expand right</Button>
	<Button onClick={() => height.set(height.get() + 200)}>Expand down</Button>
</>);
