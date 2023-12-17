import insertCustomMethod from './helper/eventListener.ts'
export { useMoveElement } from './useMoveElement'
export { useMagicList, useMagicDrag } from './useMagicList'

insertCustomMethod()

/*
* TODO
*  *.将多个功能完全分离开，每个功能都作为一个npm包发布
*    然后通过调用API的方式插入这些功能
*  1.useMagicList的第一个参数发生变化需要进行处理
* */


// const cb1 = () => {
//   console.log('第一次绑定')
// }
// const cb2 = () => {
//   console.log('第二次绑定')
// }
// const cb3 = () => {
//   console.log('第三次绑定')
// }
//
// window.priorityAddEventListener('click', cb1, { priority: 1 })
// window.priorityAddEventListener('click', cb2, { priority: 2 })
// window.priorityAddEventListener('click', cb3, { priority: 3 })
//
// window.stopCb2 = () => {
//   window.priorityRemoveEventListener('click', cb2)
// }
