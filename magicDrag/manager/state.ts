import StateManager from '../functions/stateManager'

export const stateManager = new StateManager()

export function setInitialState(target: HTMLElement, initialState, isSelected) {
	stateManager.registerElementState(target, initialState, isSelected)
}
