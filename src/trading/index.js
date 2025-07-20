/**
 * 交易管理器
 * 统一管理交易执行器
 */

const Executor = require('./executor');
const MockExecutor = require('./executors/mock_executor');
const RealExecutor = require('./executors/real_executor');
const logger = require('../utils/logger');

class ExecutorFactory {
  static createExecutor(type, options = {}) {
    switch (type.toLowerCase()) {
      case 'mock':
      case 'simulation':
        return new MockExecutor(options);
      case 'real':
      case 'live':
        return new RealExecutor(options);
      default:
        throw new Error(`不支持的执行器类型: ${type}`);
    }
  }
  
  static getSupportedExecutors() {
    return ['mock', 'simulation', 'real', 'live'];
  }
}

class TradingManager {
  constructor() {
    this.executors = new Map();
    this.activeExecutor = null;
  }
  
  registerExecutor(name, type, options = {}) {
    if (this.executors.has(name)) {
      throw new Error(`执行器 "${name}" 已存在`);
    }
    
    const executor = ExecutorFactory.createExecutor(type, { ...options, name });
    this.executors.set(name, executor);
    
    logger.info(`执行器 "${name}" 注册成功`);
    return executor;
  }
  
  getExecutor(name) {
    const executor = this.executors.get(name);
    if (!executor) {
      throw new Error(`执行器 "${name}" 不存在`);
    }
    return executor;
  }
  
  setActiveExecutor(name) {
    const executor = this.getExecutor(name);
    this.activeExecutor = executor;
    logger.info(`设置活跃执行器: ${name}`);
  }
  
  getActiveExecutor() {
    if (!this.activeExecutor) {
      throw new Error('未设置活跃执行器');
    }
    return this.activeExecutor;
  }
  
  async connectAll() {
    const connectPromises = [];
    for (const [name, executor] of this.executors.entries()) {
      connectPromises.push(
        executor.connect().catch(error => {
          logger.error(`连接执行器 ${name} 失败:`, error);
          throw error;
        })
      );
    }
    
    await Promise.all(connectPromises);
    logger.info('所有执行器已连接');
  }
  
  async disconnectAll() {
    const disconnectPromises = [];
    for (const [name, executor] of this.executors.entries()) {
      disconnectPromises.push(
        executor.disconnect().catch(error => {
          logger.error(`断开执行器 ${name} 失败:`, error);
        })
      );
    }
    
    await Promise.all(disconnectPromises);
    logger.info('所有执行器已断开连接');
  }
  
  getAllExecutors() {
    return new Map(this.executors);
  }
}

const tradingManager = new TradingManager();

module.exports = {
  Executor,
  MockExecutor,
  RealExecutor,
  ExecutorFactory,
  TradingManager,
  tradingManager
};