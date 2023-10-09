export function useWatchData(data, cb) {
	return new Proxy(data, {
		get(target: any, p: string | symbol, receiver: any): any {
			return target[p]
		},
		set(target: any, p: string | symbol, newValue: any, receiver: any): boolean {
			target[p] = newValue
			cb()
			return true
		}
	})
}

const resolvePromise = Promise.resolve()

export function nextTick(cb) {
	return resolvePromise.then(cb)
}
