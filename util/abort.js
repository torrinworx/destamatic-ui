const useAbort = (fn) => (...args) => {
	const abort = new AbortController();
	fn(abort.signal, ...args);

	return abort.abort.bind(abort);
};

export default useAbort;
