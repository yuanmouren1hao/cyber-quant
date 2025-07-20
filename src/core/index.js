/**
 * 多市场量化交易系统 - 核心模块
 * 
 * 本模块作为系统的中央控制器，负责整合各个模块并提供统一的接口
 */

const EventEmitter = require('events');
const { getConfig } = require('../config');
const logger = require('../utils/logger');

/**
 * 交易系统核心类
 * 管理整个交易系统的生命周期和组件交互
 */
class TradingSystem extends EventEmitter {
  constructor(options = {}) {
    super();
    this.options = options;
    this.config = getConfig();
    this.dataProviders = new Map();
    this.strategies = new Map();
    this.executors = new Map();
    this.isRunning = false;
    
    logger.info('交易系统核心初始化完成');
    this.emit('system:initialized');
  }

  /**
   * 注册数据提供者
   * @param {string} name - 数据提供者名称
   * @param {Object} provider - 数据提供者实例
   */
  registerDataProvider(name, provider) {
    if (this.dataProviders.has(name)) {
      logger.warn(`数据提供者 "${name}" 已存在，将被替换`);
    }
    
    this.dataProviders.set(name, provider);
    logger.info(`数据提供者 "${name}" 注册成功`);
    this.emit('provider:registered', { name, provider });
    
    return this;
  }

  /**
   * 注册交易策略
   * @param {string} name - 策略名称
   * @param {Object} strategy - 策略实例
   */
  registerStrategy(name, strategy) {
    if (this.strategies.has(name)) {
      logger.warn(`交易策略 "${name}" 已存在，将被替换`);
    }
    
    this.strategies.set(name, strategy);
    logger.info(`交易策略 "${name}" 注册成功`);
    this.emit('strategy:registered', { name, strategy });
    
    return this;
  }

  /**
   * 启动交易系统
   */
  async start() {
    if (this.isRunning) {
      logger.warn('交易系统已经在运行中');
      return;
    }

    logger.info('正在启动交易系统...');
    this.emit('system:starting');

    try {
      // 启动所有数据提供者
      for (const [name, provider] of this.dataProviders.entries()) {
        logger.info(`启动数据提供者: ${name}`);
        await provider.start();
      }

      // 启动所有交易策略
      for (const [name, strategy] of this.strategies.entries()) {
        logger.info(`启动交易策略: ${name}`);
        await strategy.start();
      }

      this.isRunning = true;
      logger.info('交易系统启动成功');
      this.emit('system:started');
    } catch (error) {
      logger.error('交易系统启动失败:', error);
      this.emit('system:error', error);
      throw error;
    }
  }

  /**
   * 停止交易系统
   */
  async stop() {
    if (!this.isRunning) {
      logger.warn('交易系统当前未运行');
      return;
    }

    logger.info('正在停止交易系统...');
    this.emit('system:stopping');

    try {
      // 停止所有交易策略
      for (const [name, strategy] of this.strategies.entries()) {
        logger.info(`停止交易策略: ${name}`);
        await strategy.stop();
      }

      // 停止所有数据提供者
      for (const [name, provider] of this.dataProviders.entries()) {
        logger.info(`停止数据提供者: ${name}`);
        await provider.stop();
      }

      this.isRunning = false;
      logger.info('交易系统已停止');
      this.emit('system:stopped');
    } catch (error) {
      logger.error('交易系统停止失败:', error);
      this.emit('system:error', error);
      throw error;
    }
  }

  /**
   * 获取数据提供者
   * @param {string} name - 数据提供者名称
   * @returns {Object} 数据提供者实例
   */
  getDataProvider(name) {
    const provider = this.dataProviders.get(name);
    if (!provider) {
      throw new Error(`数据提供者 "${name}" 不存在`);
    }
    return provider;
  }

  /**
   * 获取交易策略
   * @param {string} name - 策略名称
   * @returns {Object} 策略实例
   */
  getStrategy(name) {
    const strategy = this.strategies.get(name);
    if (!strategy) {
      throw new Error(`交易策略 "${name}" 不存在`);
    }
    return strategy;
  }
}

// 导出单例模式的交易系统实例
let instance = null;

/**
 * 获取交易系统实例
 * @param {Object} options - 系统配置选项
 * @returns {TradingSystem} 交易系统实例
 */
function getSystem(options = {}) {
  if (!instance) {
    instance = new TradingSystem(options);
  }
  return instance;
}

module.exports = {
  TradingSystem,
  getSystem
};
