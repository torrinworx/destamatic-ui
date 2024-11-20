import { mount, Observer, OArray } from 'destam-dom';
import { DragGrid, Drag, Button, Typography } from 'destamatic-ui';

const DragDots = ({ size = 8 }) => <div style={{ display: 'inline-block' }}>
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: 'black', margin: '2px' }}></div>
            <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: 'black', margin: '2px' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: 'black', margin: '2px' }}></div>
            <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: 'black', margin: '2px' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center' }}>
            <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: 'black', margin: '2px' }}></div>
            <div style={{ width: `${size}px`, height: `${size}px`, borderRadius: '50%', backgroundColor: 'black', margin: '2px' }}></div>
        </div>
    </div>
</div>;



// Initial items array wrapped in OArray to enable drag and drop reactivity.
const items = OArray([
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
            Icon={<DragDots size={5} />}
            type="text"
            onMouseDown={() => { }}
            title={"Drag to re-order"}
            style={{
                cursor: 'move',
                userSelect: 'none',
            }}
        />
        <Typography type='p1' style={{ marginLeft: '8px' }}>Item 1</Typography>
    </div>,
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
            Icon={<DragDots size={5} />}
            type="text"
            onMouseDown={() => { }}
            title={"Drag to re-order"}
            style={{
                cursor: 'move',
                userSelect: 'none',
            }}
        />
        <Typography type='p1' style={{ marginLeft: '8px' }}>Item 2</Typography>
    </div>,
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
            Icon={<DragDots size={5} />}
            type="text"
            onMouseDown={() => { }}
            title={"Drag to re-order"}
            style={{
                cursor: 'move',
                userSelect: 'none',
            }}
        />
        <Typography type='p1' style={{ marginLeft: '8px' }}>Item 2</Typography>
    </div>,
    <div style={{ display: 'flex', alignItems: 'center' }}>
        <Button
            Icon={<DragDots size={5} />}
            type="text"
            onMouseDown={() => { }}
            title={"Drag to re-order"}
            style={{
                cursor: 'move',
                userSelect: 'none',
            }}
        />
        <Typography type='p1' style={{ marginLeft: '8px' }}>Item 3</Typography>
    </div>,
]);

const orienationToggle = Observer.mutable('row');

mount(document.body, <div style={{ padding: '20px' }}>
    <Button
        label={orienationToggle}
        type="contained"
        onMouseDown={() => orienationToggle.set(orienationToggle.get() === 'row' ? 'column' : 'row')}
    />
    <Typography type='h5'>Draggable List (Row)</Typography>
    <DragGrid
        items={items}
        orientation={orienationToggle}
    />

    <div style={{
        width: '100%',
        height: '1000px',
        backgroundColor: 'blue',
    }}>
        <Drag>
            <div style={{
                backgroundColor: 'red',
                height: '40px',
                borderRadius: '12px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
            }}>
                <Typography type='h5'>Drag</Typography>
            </div>
        </Drag>
        <Drag constrainToParent>
            <div style={{
                backgroundColor: 'red',
                height: '40px',
                borderRadius: '12px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
            }}>
                <Typography type='h5'>Constrained to Parent</Typography>
            </div>
        </Drag>
        <Drag snapBack>
            <div style={{
                backgroundColor: 'red',
                height: '40px',
                borderRadius: '12px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
            }}>
                <Typography type='h5'>Snap Back</Typography>
            </div>
        </Drag>
        <Drag constrainToParent snapBack>
            <div style={{
                backgroundColor: 'red',
                height: '40px',
                borderRadius: '12px',
                padding: '10px',
                display: 'flex',
                alignItems: 'center',
            }}>
                <Typography type='h5'>Snap Back & Constrained to Parent</Typography>
            </div>
        </Drag>
    </div>
</div>);
