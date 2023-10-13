export { insertResizeTask, stopListen } from './browserBehavier.ts'

const resolvePromise = Promise.resolve()

export function nextTick(cb) {
	return resolvePromise.then(cb)
}

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

export function watchIsPress(callback) {
	window.addEventListener('mouseup', callback.bind(null, false))
	window.addEventListener('mousedown', callback.bind(null, true))
}

