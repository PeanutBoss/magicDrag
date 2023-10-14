## 版本记录

**1.0.0 ~ 1.0.5**:
> 初始版本

**1.1.0 ~ 1.1.3**  
> fix
>  - 将vue包替换为 @vue/reactivity @vue/runtime-core
>  - 删除lodash依赖
>  - 移动后重置movement失败
>  - 容器元素与body不在同一基点，拖拽时目标元素的偏移问题
>
> feature
>  - 完善文档
>  - 添加是否启用参考线配置项
>  - 优化代码

**1.1.4**
> fix
> - window触发resize的时候更新容器元素尺寸信息
> 
> feature
>  - 如果容器是body元素，需要给body添加 overflow: hidden 禁止出现滚动条
> 
