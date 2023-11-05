import { Plugin } from '../functions'

class RegionalSelection implements Plugin {
  name: string
  constructor(private container: HTMLElement) {
    this.name = 'regionalSelection'
    this.init()
  }
  init() {
    console.log(this.container, 'this.container')
    // this.container.addEventListener('mousedown', event => {
    //   console.log(event, 'event')
    // })
  }
  unbind() {}
}

export default RegionalSelection
