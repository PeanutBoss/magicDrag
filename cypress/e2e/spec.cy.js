describe('拖拽功能测试', () => {
  it('基本拖拽功能', () => {
    cy.visit('http://localhost:9001/')
    cy.viewport(1500, 1000)

    // 在元素box1上按下鼠标左键
    cy.get('.box')
      .trigger('mousedown', 'topLeft')

    // 按下后会显示8个轮廓点
    cy.get('.magic_drag-outline_point').should('be.visible')

    // 鼠标移动到页面 195,211 的位置
    cy.get('body')
      .trigger('mousemove', { pageX: 195, pageY: 211 })

    // box被 box1 吸附，X轴方向停留在200，Y轴方向与box1距离超过10，没有被吸附
    cy.get('.box').then(el => {
      const rect = el[0].getBoundingClientRect()
      cy.wrap(rect.left).should('eq', 200)
      cy.wrap(rect.top).should('eq', 211)
    })

    cy.get('body')
      .trigger('mousemove', { pageX: 209, pageY: 199 })

    // 鼠标抬起
    cy.get('body').trigger('mouseup')

    // box元素的位置被移动到 200,200
    cy.get('.box').then(el => {
      const rect = el[0].getBoundingClientRect()
      cy.wrap(rect.left).should('eq', 200)
      cy.wrap(rect.top).should('eq', 200)
    })

    cy.get('.wrap').trigger('mousedown')
    // 鼠标在其他位置按下后会隐藏轮廓点
    cy.get('.magic_drag-outline_point').should('not.be.visible')
    cy.get('.wrap').trigger('mouseup')
  })
})
