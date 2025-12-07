// Simple function to check if running in a node or browser environment
const is_node = () => typeof process !== 'undefined' && process.versions?.node;

export default is_node;
