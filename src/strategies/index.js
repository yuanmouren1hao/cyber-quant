/**
 * 策略管理器
 * 统一管理所有交易策略
 */

const Strategy = require('./base');
const MovingAverageStrategy = require('./moving_average');
const logger = require('../utils/logger');

class StrategyFactory {
  static createStrategy(type, options, dataProvider) {
    switch (type.toLowerCase()) {
      case 'moving_average':
      case 'ma':
        return new MovingAverageStrategy(options, dataProvider);
      default:
        throw new Error(`不支持的策略类型: ${type}`);
    }
  }
  
  static getSupportedStrategies() {
    return ['moving_average', 'ma'];
  }
}

class StrategyManager {
  constructor() {
    this.strategies = new Map();
    this.activeStrategies = new Set();
  }
  
  registerStrategy(name, type, options, dataProvider) {
    if (this.strategies.has(name)) {
      throw new Error(`策略 "${name}" 已存在`);
    }
    
    const strategy = StrategyFactory.createStrategy(type, { ...options, name }, dataProvider);
    this.strategies.set(name, strategy);
    
    strategy.on('strategy:signal', (signal) => {
      this.handleSignal(signal);
    });
    
    logger.info(`策略 "${name}" 注册成功`);
    return strategy;
  }
  
  getStrategy(name) {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`策略 "${name}" 不存在`);
    }
    return strategy;
  }
  
  async startStrategy(name) {
    const strategy = this.getStrategy(name);
    await strategy.start();
    this.activeStrategies.add(name);
  }
  
  async stopStrategy(name) {
    const strategy = this.getStrategy(name);
    await strategy.stop();
    this.activeStrategies.delete(name);
  }
  
  async startAll() {
    const startPromises = [];
    for (const [name, strategy] of this.strategies.entries()) {
      startPromises.push(this.startStrategy(name));
    }
    await Promise.all(startPromises);
    logger.info('所有策略已启动');
  }
  
  async stopAll() {
    const stopPromises = [];
    for (const name of this.activeStrategies) {
      stopPromises.push(this.stopStrategy(name));
    }
    await Promise.all(stopPromises);
    logger.info('所有策略已停止');
  }
  
  handleSignal(signal) {
    logger.info('收到交易信号:', signal);
    // 这里可以添加信号处理逻辑，如发送给交易执行器
  }
  
  getAllStrategies() {
    return new Map(this.strategies);
  }
  
  getActiveStrategies() {
    return new Set(this.activeStrategies);
  }
}

module.exports = {
  Strategy,
  MovingAverageStrategy,
  StrategyFactory,
  StrategyManager
};