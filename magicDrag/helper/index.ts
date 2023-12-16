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

const cbs = {}
export function addEventListener(type: any, cb: Function, { priority, ...options }) {
	if (!cbs[type]) {
		cbs[type] = []
		window.addEventListener(type, event => {
			cbs[type].forEach(cb => cb(event))
		})
	}
	cbs[type].push({ priority, cb })
}

