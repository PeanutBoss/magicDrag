import useMagicDrag from '../magicDrag/useMagicDrag'

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
    mouseUpEvent = new MouseEvent('mouseup')
    mouseMoveEvent = new MouseEvent('mousemove', { movementX: 10, movementY: 10 })

    document.body.innerHTML = `
      <div id="element" style="width: 200px;height: 200px"></div>
    `

    element = document.getElementById('element')

    targetState = useMagicDrag(element)
  })

  it.only('is the mouse press down', async () => {
    element.dispatchEvent(mouseDownEvent)
    await new Promise(resolve => setTimeout(resolve, 500))
    expect(targetState.targetIsPress.value).toBe(true)

    element.dispatchEvent(mouseUpEvent)
    await new Promise(resolve => setTimeout(resolve, 500))
    expect(targetState.targetIsPress.value).toBe(false)
  })

  it('the position of the element after dragging', () => {
    element.dispatchEvent(mouseDownEvent)
    element.dispatchEvent(mouseDownEvent)
    element.dispatchEvent(mouseUpEvent)

    expect(targetState.targetHeight.value).toBe(200)
  })

  it('the size of the after resizing', () => {
    const resizeMouseDown = new MouseEvent('mousedown', { clientX: 200, clientY: 200 })
    element.dispatchEvent(resizeMouseDown)
  })

  it('show ref line or not', () => {
    const refLineEle = document.querySelectorAll('.ref-line')
    const displayList = [...refLineEle].map(m => m.style.display)
    expect(displayList.includes('block')).toBe(true)
  })

})


