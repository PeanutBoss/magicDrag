import useMagicDrag from '../magicDrag/useMagicDrag'
import { nextTick } from 'vue'

describe("base function", () => {

  let element,
    targetState,
    mouseUpEvent,
    mouseDownEvent,
    mouseMoveEvent
  beforeAll(() => {

    mouseDownEvent = new MouseEvent('mousedown', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    mouseUpEvent = new MouseEvent('mouseup', {
      bubbles: true,
      cancelable: true,
      view: window
    })
    mouseMoveEvent = new MouseEvent('mousemove', {
      movementX: 10,
      movementY: 10,
      view: window
    })

    document.body.innerHTML = `
      <div id="element" style="width: 200px;height: 200px;left: 100px;top: 100px"></div>
    `

    element = document.getElementById('element')

    targetState = useMagicDrag(element)
  })

  it('is the mouse press down', async () => {
    element.dispatchEvent(mouseDownEvent)
    await nextTick()
    expect(targetState.targetIsPress.value).toBe(true)

    element.dispatchEvent(mouseUpEvent)
    await nextTick()
    expect(targetState.targetIsPress.value).toBe(false)
  })

  it('the position of the element after dragging', async () => {
    // 选中当前组件
    element.dispatchEvent(mouseDownEvent)
    element.dispatchEvent(mouseUpEvent)
    expect(targetState.targetHeight.value).toBe(200)
  })

  it.skip('the size of the after resizing', () => {
    const resizeMouseDown = new MouseEvent('mousedown', { clientX: 200, clientY: 200 })
    element.dispatchEvent(resizeMouseDown)
  })

  it.skip('show ref line or not', () => {
    const refLineEle = document.querySelectorAll('.ref-line')
    const displayList = [...refLineEle].map(m => m.style.display)
    // expect(displayList.includes('block')).toBe(true)
  })

})


