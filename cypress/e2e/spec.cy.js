import { DISTANCE_TIP_CLASS_NAME } from '../../magicDrag/plugins/refLine'

describe('拖拽功能测试', () => {
  it('基本拖拽功能', () => {
    cy.visit('http://localhost:9001/')

    // 在元素box1上按下鼠标左键
    cy.get('.box')
      .trigger('mousedown', 'topLeft')

    // 按下后会显示8个轮廓点
    cy.get('.magic_drag-outline_point').should('be.visible')

    // 鼠标移动到页面 195,211 的位置
    cy.get('body')
      .trigger('mousemove', { pageX: 195, pageY: 211 })

    // box被 box1 吸附，X轴方向停留在200，Y轴方向与box1距离超过10，没有被吸附
    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.left).should('eq', 200)
      cy.wrap(rect.top).should('eq', 211)
    })

    cy.get('body')
      .trigger('mousemove', { pageX: 209, pageY: 199 })

    // 鼠标抬起
    cy.get('body').trigger('mouseup')

    // box元素的位置被移动到 200,200
    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.left).should('eq', 200)
      cy.wrap(rect.top).should('eq', 200)
    })

    cy.get('.wrap').trigger('mousedown')
    // 鼠标在其他位置按下后会隐藏轮廓点
    cy.get('.magic_drag-outline_point').should('not.be.visible')
    cy.get('.wrap').trigger('mouseup')
  })

  it('容器边界限制', () => {
    cy.visit('http://localhost:9001/')

    // 在元素box1上按下鼠标左键
    cy.get('.box')
      .trigger('mousedown', 'topLeft')

    // 鼠标移动到页面 0,0 的位置
    cy.get('body')
      .trigger('mousemove', { pageX: 0, pageY: 0 })

    // 等待页面更新完成
    cy.wait(500)

    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      // box元素被限制在容器左上角 100,100 的位置
      cy.wrap(rect.left).should('eq', 100)
      cy.wrap(rect.top).should('eq', 100)
    })

    // 鼠标移动到页面 0,0 的位置
    cy.get('body')
      .trigger('mousemove', { pageX: 1000, pageY: 1000 })

    // 等待页面更新完成
    cy.wait(500)

    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      // box元素被限制在容器左上角 100,100 的位置
      cy.wrap(rect.left).should('eq', 800)
      cy.wrap(rect.top).should('eq', 800)
    })

    // 鼠标抬起
    cy.get('body')
      .trigger('mouseup')
  })

  it.only('元素大小限制', () => {
    cy.visit('http://localhost:9001/')

    // 选中目标元素
    cy.get('.box')
      .trigger('mousedown')
    cy.get('.box')
      .trigger('mouseup')

    // 按下左上角的轮廓点
    cy.get('.lt')
      .trigger('mousedown')

    cy.get('body')
      .trigger('mousemove', { pageX: 0, pageY: 0 })

    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.width).should('eq', 256)
    })

    cy.get('body')
      .trigger('mousemove', { pageX: 500, pageY: 500 })

    cy.wait(500)
    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.width).should('eq', 100)
    })

    cy.get('body')
      .trigger('mouseup')

    cy.get('.box')
      .trigger('mousedown', 'center')

    cy.get('body')
      .trigger('mousemove', { pageX: 300, pageY: 300 })

    cy.get('body')
      .trigger('mouseup')

    // 按下左上角的轮廓点
    cy.get('.lt')
      .trigger('mousedown')

    cy.get('body')
      .trigger('mousemove', { pageX: 0, pageY: 0 })

    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.width).should('eq', 250)
    })
  })

  it('辅助线、距离提示功能', async () => {
    cy.visit('http://localhost:9001/')

    // 在元素box1上按下鼠标左键
    cy.get('.box')
      .trigger('mousedown', 'topLeft')

    // 鼠标移动到页面 200,300 的位置
    cy.get('body')
      .trigger('mousemove', { pageX: 200, pageY: 300 })

    // box在y轴方向上会与 box1 的右边对齐，显示的辅助线的类名包含 yr
    cy.get('.yr')
      .should('be.visible')

    // 显示距离提示
    cy.get(`.${DISTANCE_TIP_CLASS_NAME}`).should('be.visible')

    // 鼠标移动到页面 0,300 的位置
    cy.get('body')
      .trigger('mousemove', { pageX: 500, pageY: 0 })

    // box在y轴方向上会与 box1 水平对齐，显示的辅助线的类名包含 xr、xc、xl
    cy.get('.xr, .xl, .xc')
      .should('be.visible')

    // 显示距离提示
    cy.get(`.${DISTANCE_TIP_CLASS_NAME}`).should('be.visible')

    // 提示的距离为300
    await cy.get(`.${DISTANCE_TIP_CLASS_NAME}`)
      .then(els => {
        cy.wrap(els[0].innerText).should('eq', '300')
      })

    // 鼠标抬起
    cy.get('body').trigger('mouseup')
  })
})
