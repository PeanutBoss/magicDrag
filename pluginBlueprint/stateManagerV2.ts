class StateManager {
  constructor() {
    this.state = {
      currentElement: null, // 当前操作元素的状态信息
    };
    this.listeners = [];
  }

  // 注册状态监听器
  subscribe(listener) {
    this.listeners.push(listener);
  }

  // 更新状态并通知监听器
  updateState(newState) {
    this.state = { ...this.state, ...newState };
    this.notifyListeners();
  }

  // 通知监听器状态更新
  notifyListeners() {
    this.listeners.forEach(listener => {
      listener(this.state);
    });
  }

  // 获取当前状态
  getState() {
    return this.state;
  }
}

const stateManager = new StateManager();
export default stateManager;




// PluginA.js

import stateManager from './StateManager';

class PluginA {
  constructor() {
    // 订阅状态变化
    stateManager.subscribe(this.handleStateChange.bind(this));
  }

  // 当状态发生变化时被调用
  handleStateChange(newState) {
    // 处理状态变化，例如更新插件的UI或执行操作
    console.log('PluginA: State changed', newState);
  }

  // 设置当前元素的状态信息
  setElementState(elementState) {
    stateManager.updateState({ currentElement: elementState });
  }
}

const pluginA = new PluginA();
export default pluginA;
