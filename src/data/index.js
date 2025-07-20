/**
 * 数据管理器
 * 统一管理所有数据提供者
 */

const { getConfig } = require('../config');
const logger = require('../utils/logger');
const OKExDataProvider = require('./providers/okex');

/**
 * 数据管理器类
 */
class DataManager {
  constructor() {
    this.config = getConfig();
    this.providers = new Map();
    this.isInitialized = false;
  }

  /**
   * 初始化数据管理器
   */
  async initialize() {
    if (this.isInitialized) {
      return;
    }

    try {
      // 初始化OKEx数据提供者
      if (this.config.okex.apiKey) {
        const okexProvider = new OKExDataProvider(this.config.okex);
        this.providers.set('okex', okexProvider);
        logger.info('OKEx数据提供者已注册');
      }

      this.isInitialized = true;
      logger.info('数据管理器初始化完成');
    } catch (error) {
      logger.error('数据管理器初始化失败:', error);
      throw error;
    }
  }

  /**
   * 启动所有数据提供者
   */
  async startAll() {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const startPromises = [];
    for (const [name, provider] of this.providers.entries()) {
      startPromises.push(
        provider.start().catch(error => {
          logger.error(`启动数据提供者 ${name} 失败:`, error);
          throw error;
        })
      );
    }

    await Promise.all(startPromises);
    logger.info('所有数据提供者已启动');
  }

  /**
   * 停止所有数据提供者
   */
  async stopAll() {
    const stopPromises = [];
    for (const [name, provider] of this.providers.entries()) {
      stopPromises.push(
        provider.stop().catch(error => {
          logger.error(`停止数据提供者 ${name} 失败:`, error);
        })
      );
    }

    await Promise.all(stopPromises);
    logger.info('所有数据提供者已停止');
  }

  /**
   * 获取数据提供者
   * @param {string} name - 提供者名称
   * @returns {Object} 数据提供者实例
   */
  getProvider(name) {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`数据提供者 "${name}" 不存在`);
    }
    return provider;
  }

  /**
   * 获取所有数据提供者
   * @returns {Map} 数据提供者映射
   */
  getAllProviders() {
    return new Map(this.providers);
  }
}

// 导出单例实例
const dataManager = new DataManager();

module.exports = {
  DataManager,
  dataManager
};
