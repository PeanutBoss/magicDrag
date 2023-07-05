import { getElement } from "../utils/tools";
import { onMounted, reactive, ref } from 'vue'

export default function useDragResize (targetSelector: string | HTMLElement) {
	onMounted(() => {
		initTarget()
	})
	function initTarget () {
		$target = getElement(targetSelector)
	}

	let $target
}
