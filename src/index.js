/**
 * 多市场量化交易系统 - 主入口文件
 * 
 * 本文件负责初始化和启动整个交易系统
 */

const { getConfig, validateConfig } = require('./config');
const { getSystem } = require('./core');
const { dataManager } = require('./data');
const { StrategyManager } = require('./strategies');
const { backtestManager } = require('./backtest');
const { tradingManager } = require('./trading');
const logger = require('./utils/logger');

class TradingApp {
  constructor() {
    this.config = null;
    this.system = null;
    this.dataManager = null;
    this.strategyManager = null;
    this.backtestManager = null;
    this.tradingManager = null;
    this.isRunning = false;
  }
  
  async initialize() {
    try {
      logger.info('正在初始化交易系统...');
      
      this.config = getConfig();
      validateConfig(this.config);
      logger.info('配置加载完成');
      
      this.system = getSystem();
      this.dataManager = dataManager;
      await this.dataManager.initialize();
      
      this.strategyManager = new StrategyManager();
      this.backtestManager = backtestManager;
      this.tradingManager = tradingManager;
      
      for (const [name, provider] of this.dataManager.getAllProviders()) {
        this.system.registerDataProvider(name, provider);
      }
      
      logger.info('交易系统初始化完成');
    } catch (error) {
      logger.error('交易系统初始化失败:', error);
      throw error;
    }
  }
  
  async start() {
    if (this.isRunning) {
      logger.warn('交易系统已经在运行中');
      return;
    }
    
    try {
      logger.info('正在启动交易系统...');
      
      await this.dataManager.startAll();
      await this.system.start();
      
      this.isRunning = true;
      logger.info('交易系统启动成功');
      
      this.setupGracefulShutdown();
      
    } catch (error) {
      logger.error('交易系统启动失败:', error);
      throw error;
    }
  }
  
  async stop() {
    if (!this.isRunning) {
      logger.warn('交易系统当前未运行');
      return;
    }
    
    try {
      logger.info('正在停止交易系统...');
      
      await this.strategyManager.stopAll();
      await this.tradingManager.disconnectAll();
      await this.system.stop();
      await this.dataManager.stopAll();
      
      this.isRunning = false;
      logger.info('交易系统已停止');
      
    } catch (error) {
      logger.error('交易系统停止失败:', error);
      throw error;
    }
  }
  
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`收到 ${signal} 信号，正在优雅关闭...`);
      try {
        await this.stop();
        process.exit(0);
      } catch (error) {
        logger.error('优雅关闭失败:', error);
        process.exit(1);
      }
    };
    
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('uncaughtException', (error) => {
      logger.error('未捕获的异常:', error);
      shutdown('uncaughtException');
    });
    process.on('unhandledRejection', (reason, promise) => {
      logger.error('未处理的Promise拒绝:', reason);
      shutdown('unhandledRejection');
    });
  }
  
  getStatus() {
    return {
      isRunning: this.isRunning,
      dataProviders: this.dataManager ? Array.from(this.dataManager.getAllProviders().keys()) : [],
      strategies: this.strategyManager ? Array.from(this.strategyManager.getAllStrategies().keys()) : [],
      executors: this.tradingManager ? Array.from(this.tradingManager.getAllExecutors().keys()) : []
    };
  }
}

async function main() {
  const app = new TradingApp();
  
  try {
    await app.initialize();
    await app.start();
    
    logger.info('交易系统运行中...');
    logger.info('系统状态:', app.getStatus());
    
  } catch (error) {
    logger.error('启动失败:', error);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = {
  TradingApp,
  main
};