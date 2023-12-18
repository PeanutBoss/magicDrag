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
      .trigger('mouseup')

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

  it('设置初始位置和尺寸', () => {
    cy.visit('http://localhost:9001/')

    cy.get('.box2').then(els => {
      const box = els[0]
      const rect = box.getBoundingClientRect()
      cy.wrap(rect.left).should('eq', 575)
      cy.wrap(rect.top).should('eq', 575)
      cy.wrap(rect.width).should('eq', 170)
      cy.wrap(rect.height).should('eq', 180)
    })
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

  it('元素大小限制 - 左上方向', () => {
    cy.visit('http://localhost:9001/')

    // 选中目标元素
    cy.get('.box')
      .trigger('mousedown')
    cy.get('.box')
      .trigger('mouseup')

    // 按下左上角的轮廓点
    cy.get('.lt')
      .trigger('mousedown')

    // 鼠标移动到 0,0 位置，.box会被放大
    cy.get('body')
      .trigger('mousemove', { pageX: 0, pageY: 0 })

    // 限制的最大尺寸为 256 * 256
    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.width).should('eq', 256)
      cy.wrap(rect.height).should('eq', 256)
    })

    // 鼠标移动到 500,500 位置，.box会被缩小
    cy.get('body')
      .trigger('mousemove', { pageX: 500, pageY: 500 })

    // 确保渲染完毕
    cy.wait(500)

    // 限制的最小尺寸为 100 * 100
    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.width).should('eq', 100)
      cy.wrap(rect.height).should('eq', 100)
    })

    // 抬起鼠标
    cy.get('body')
      .trigger('mouseup')

    // 按下box
    cy.get('.box')
      .trigger('mousedown', 'center')

    // 移动到 300,300 的位置
    cy.get('body')
      .trigger('mousemove', { pageX: 300, pageY: 300 })
      .trigger('mouseup')

    // 按下左上角的轮廓点
    cy.get('.lt')
      .trigger('mousedown')

    // 鼠标移动到 0,0 位置，元素被放大
    cy.get('body')
      .trigger('mousemove', { pageX: 0, pageY: 0 })

    // 确保渲染完毕
    cy.wait(500)

    // 因为碰到容器边界，到达 250 * 250 后不能再被放大
    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.width).should('eq', 250)
      cy.wrap(rect.height).should('eq', 250)
    })

    // 抬起鼠标
    cy.get('body')
      .trigger('mouseup')
  })

  it('元素大小限制 - 右下方向', () => {
    cy.visit('http://localhost:9001/')

    // 选中目标元素
    cy.get('.box')
      .trigger('mousedown')

    // 将box移动到 600,600 的位置
    cy.get('body')
      .trigger('mousemove', { pageX: 650, pageY: 650 })
      .trigger('mouseup')

    // 按下右下角的轮廓点
    cy.get('.rb')
      .trigger('mousedown')

    // 鼠标移动到 1000,1000 位置，.box会被放大
    cy.get('body')
      .trigger('mousemove', { pageX: 1000, pageY: 1000 })

    // 限制的最大尺寸为 256 * 256
    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.width).should('eq', 256)
      cy.wrap(rect.height).should('eq', 256)
    })

    // 鼠标移动到 0,0 位置，.box会被缩小
    cy.get('body')
      .trigger('mousemove', { pageX: 0, pageY: 0 })

    // 确保渲染完毕
    cy.wait(500)

    // 限制的最小尺寸为 100 * 100
    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.width).should('eq', 100)
      cy.wrap(rect.height).should('eq', 100)
    })

    // 抬起鼠标
    cy.get('body')
      .trigger('mouseup')

    // 按下box
    cy.get('.box')
      .trigger('mousedown', 'center')

    // 移动到 700,700 的位置
    cy.get('body')
      .trigger('mousemove', { pageX: 750, pageY: 750 })
      .trigger('mouseup')

    // 按下右下角的轮廓点
    cy.get('.rb')
      .trigger('mousedown')

    // 鼠标移动到 1000,1000 位置，元素被放大
    cy.get('body')
      .trigger('mousemove', { pageX: 1000, pageY: 1000 })

    // 确保渲染完毕
    cy.wait(500)

    // 因为碰到容器边界，到达 200 * 200 后不能再被放大
    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.width).should('eq', 200)
      cy.wrap(rect.height).should('eq', 200)
    })

    // 抬起鼠标
    cy.get('body')
      .trigger('mouseup')
  })

  it('多选功能测试', () => {
    cy.visit('http://localhost:9001/')

    // 选中两个组件
    cy.get('.wrap')
      .trigger('mousedown', { which: 1, pageX: 800, pageY: 800 })
    cy.get('body')
      .trigger('mousemove', { pageX: 175, pageY: 175 })

    // 检查区域提示的dom是否显示
    cy.get('.regional-selection')
      .should('be.visible')

    // 鼠标抬起
    cy.get('body')
      .trigger('mouseup')

    // 检查被选中的元素是否出现被选中的样式
    cy.get('.box').then(els => {
      const outline = els[0].style.outline
      cy.wrap(outline).should('have.string', '1px')
      cy.wrap(outline).should('have.string', 'black')
      cy.wrap(outline).should('have.string', 'solid')
    })

    // 移动box元素
    cy.get('.box')
      .trigger('mousedown', 'center')
    cy.get('body')
      .trigger('mousemove', { pageX: 450, pageY: 450 })
      .trigger('mouseup')

    // box2元素也移动了相同的距离
    cy.get('.box2').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.left).should('eq', 675)
      cy.wrap(rect.top).should('eq', 675)
    })

    cy.get('.wrap')
      .trigger('mousedown', 'bottomLeft')

    // 检查区域提示的dom是否隐藏
    cy.get('.regional-selection')
      .should('not.be.visible')
  })

  it.only('多选边界限制', () => {
    cy.visit('http://localhost:9001/')

    // 选中两个组件
    cy.get('.wrap')
      .trigger('mousedown', { which: 1, pageX: 800, pageY: 800 })
    cy.get('body')
      .trigger('mousemove', { pageX: 175, pageY: 175 })
      .trigger('mouseup')

    // 移动box元素
    cy.get('.box2')
      .trigger('mousedown', 'center')
    cy.get('body')
      .trigger('mousemove', { pageX: 100, pageY: 1000 })
      .trigger('mouseup')

    // box元素位置在容器左下角，没有超出容器
    cy.get('.box').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.left).should('eq', 100)
      cy.wrap(rect.top).should('eq', 445)
    })

    // 移动box元素
    cy.get('.box')
      .trigger('mousedown', 'center')
    cy.get('body')
      .trigger('mousemove', { pageX: 1000, pageY: 0 })
      .trigger('mouseup')

    // box元素位置在容器左下角，没有超出容器
    cy.get('.box2').then(els => {
      const rect = els[0].getBoundingClientRect()
      cy.wrap(rect.left).should('eq', 730)
      cy.wrap(rect.top).should('eq', 375)
    })
  })

  it('多选吸附', () => {})

  // 放到最后一个
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
