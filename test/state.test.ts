import StateManager from "../magicDrag/functions/stateManager.ts";

const stateManager = new StateManager()

describe('state manager', () => {

  let box1, box2, box3
  beforeAll(() => {
    document.body.innerHTML = `
      <div class="box1"></div>
      <div class="box2"></div>
      <div class="box3"></div>
    `
    box1 = document.querySelector('.box1')
    box2 = document.querySelector('.box2')
    box3 = document.querySelector('.box3')
  })

  stateManager.registerElementState(box1, {})

})
