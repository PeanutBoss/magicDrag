import StateManager from '../functions/stateManager'
import StateManagerNew from '../functions/stateManagerNew'

export const stateManager = new StateManager()

export function setInitialState(target: HTMLElement, initialState, isSelected) {
	stateManager.registerElementState(target, initialState, isSelected)
}

export const stateManagerNew = new StateManagerNew()

export function setInitialStateNew(target: HTMLElement, initialState, isSelected) {
	stateManagerNew.registerElementState(target, initialState, isSelected)
}
