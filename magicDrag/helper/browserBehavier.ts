let resizeTasks = []

function executeTasks(event) {
  resizeTasks.forEach(task => task(event))
}

export function insertResizeTask(task: Function) {
  resizeTasks.push(task)
}

export function stopListen() {
  window.removeEventListener('resize', executeTasks)
  resizeTasks = []
}

window.addEventListener('resize', executeTasks)

