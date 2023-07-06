import { getElement } from "../utils/tools.ts";
import { onMounted, reactive, ref, watchEffect, nextTick, toRefs } from 'vue/dist/vue.esm-bundler.js'
import useMovePoint from "./useMovePoint.ts";
import {watch} from "vue";

export default function useDragResize (targetSelector: string | HTMLElement) {
	onMounted(() => {
		initTarget()

    createDragPoint($target, 10)
	})

  let $target
  const initialTarget = reactive({
    left: 0,
    top: 0,
    width: 0,
    height: 0
  })
	function initTarget () {
		$target = getElement(targetSelector)
    const rect = $target.getBoundingClientRect()
    for (const rectKey in initialTarget) {
      initialTarget[rectKey] = rect[rectKey]
    }
	}

  /*
  * TODO 滚动条问题 边界问题
  * */
  const pointElements = {
    lt: null,
    lb: null,
    rt: null,
    rb: null,
    t: null,
    b: null,
    l: null,
    r: null
  }
  const pointStrategies = {
    lt (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.left = left + offsetX + 'px'
      target.style.top = top + offsetY + 'px'
      target.style.width = width - offsetX + 'px'
      target.style.height = height - offsetY + 'px'
    },
    lb (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.left = left + offsetX + 'px'
      target.style.width = width - offsetX + 'px'
      target.style.height = height + offsetY + 'px'
    },
    rt (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.top = top + offsetY + 'px'
      target.style.width = width + offsetX + 'px'
      target.style.height = height - offsetY + 'px'
    },
    rb (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.width = width + offsetX
      target.style.height = height + offsetY
    },
    t (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.top = top + offsetY + 'px'
      target.style.height = height - offsetY + 'px'
    },
    b (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.height = height + offsetY
    },
    l (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.left = left + offsetX + 'px'
      target.style.width = width - offsetX + 'px'
    },
    r (target: HTMLElement, { left, top, height, width, offsetX, offsetY }) {
      target.style.width = width + offsetX + 'px'
    }
  }

  // 创建供拖拽的元素
  function createDragPoint (target: HTMLElement, pointSize: number) {
    const { left, top, width, height } = toRefs(initialTarget)
    const halfPointSize = pointSize / 2
    const parentNode = target.parentNode
    const pointPosition = createParentPosition(initialTarget, pointSize)
    for (const direction in pointPosition) {
      const point = pointElements[direction] || (pointElements[direction] = document.createElement('div'))
      point.style.position = 'absolute'
      point.style.width = pointSize + 'px'
      point.style.height = pointSize + 'px'
      setPosition(point, pointPosition, direction)
      point.style.cursor = pointPosition[direction][2]
      point.style.boxSizing = 'border-box'
      point.style.border = '1px solid #333'
      point.style.borderRadius = '50%'
      parentNode.appendChild(point)
      // TODO 将所有的 width/height 换成initialTarget的数据
      const { isPress, movementX, movementY } = useMovePoint(point, (x, y) => {
        pointStrategies[direction](target, { left: initialTarget.left, top: initialTarget.top, width: initialTarget.width, height: initialTarget.height, offsetX: x, offsetY: y })
        // FIXME pointPosition计算有问题
        const pointPosition = createParentPosition({
          left: initialTarget.left + movementX.value,
          top: initialTarget.top + movementY.value,
          width: initialTarget.width + movementX.value,
          height: initialTarget.height + movementY.value
        }, pointSize)
        for (const innerDirection in pointPosition) {
          if (innerDirection === direction) continue
          setPosition(pointElements[innerDirection], pointPosition, innerDirection)
        }
      })
      // 松开鼠标时更新宽高信息
      watch(isPress, () => {
        if (!isPress.value) {
          initialTarget.width = target.offsetWidth
          initialTarget.height = target.offsetHeight
          initialTarget.left = target.offsetLeft
          initialTarget.top = target.offsetTop
        }
      })
    }
  }

  function setPosition (point: HTMLElement, pointPosition, direction) {
    point.style.left = pointPosition[direction][0] + 'px'
    point.style.top = pointPosition[direction][1] + 'px'
  }

  function createParentPosition ({ left, top, width, height }, pointSize: number) {
    const halfPointSize = pointSize / 2
    return {
      lt: [left - halfPointSize, top - halfPointSize, 'nw-resize'],
      lb: [left - halfPointSize, top + height - halfPointSize, 'ne-resize'],
      rt: [left + width - halfPointSize, top - halfPointSize, 'ne-resize'],
      rb: [left + width - halfPointSize, top + height - halfPointSize, 'nw-resize'],
      t: [left + width / 2 - halfPointSize, top - halfPointSize, 'n-resize'],
      b: [left + width / 2 - halfPointSize, top + height - halfPointSize, 'n-resize'],
      l: [left - halfPointSize, top + height / 2 - halfPointSize, 'e-resize'],
      r: [left + width - halfPointSize, top + height / 2 - halfPointSize, 'e-resize']
    }
  }
  function createTargetPosition ({ left, top, width, height }, pointSize: number) {
    const halfPointSize = pointSize / 2
    return {
      lt: [0 - halfPointSize, 0 - halfPointSize, 'nw-resize'],
      lb: [0 - halfPointSize, height - halfPointSize, 'ne-resize'],
      rt: [width - halfPointSize, 0 - halfPointSize, 'ne-resize'],
      rb: [width - halfPointSize, height - halfPointSize, 'nw-resize'],
      t: [width / 2 - halfPointSize, 0 - halfPointSize, 'n-resize'],
      b: [width / 2 - halfPointSize, height - halfPointSize, 'n-resize'],
      l: [0 - halfPointSize, height / 2 - halfPointSize, 'e-resize'],
      r: [width - halfPointSize, height / 2 - halfPointSize, 'e-resize']
    }
  }
}
