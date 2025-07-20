/**
 * 回测管理器
 * 统一管理回测任务
 */

const BacktestEngine = require('./backtest_engine');
const logger = require('../utils/logger');

class BacktestManager {
  constructor() {
    this.engines = new Map();
    this.results = new Map();
    this.isRunning = false;
  }
  
  createBacktest(name, options = {}) {
    if (this.engines.has(name)) {
      throw new Error(`回测任务 "${name}" 已存在`);
    }
    
    const engine = new BacktestEngine(options);
    this.engines.set(name, engine);
    
    engine.on('backtest:started', () => {
      logger.info(`回测任务 "${name}" 开始`);
    });
    
    engine.on('backtest:progress', (data) => {
      logger.info(`回测任务 "${name}" 进度: ${data.progress.toFixed(2)}%`);
    });
    
    engine.on('backtest:completed', (results) => {
      logger.info(`回测任务 "${name}" 完成`);
      this.results.set(name, results);
    });
    
    engine.on('backtest:error', (error) => {
      logger.error(`回测任务 "${name}" 失败:`, error);
    });
    
    logger.info(`回测任务 "${name}" 创建成功`);
    return engine;
  }
  
  async runBacktest(name, strategy, historicalData, startDate, endDate) {
    const engine = this.engines.get(name);
    if (!engine) {
      throw new Error(`回测任务 "${name}" 不存在`);
    }
    
    this.isRunning = true;
    try {
      const results = await engine.runBacktest(strategy, historicalData, startDate, endDate);
      this.isRunning = false;
      return results;
    } catch (error) {
      this.isRunning = false;
      throw error;
    }
  }
  
  getResults(name) {
    return this.results.get(name);
  }
  
  getAllResults() {
    return new Map(this.results);
  }
  
  removeBacktest(name) {
    this.engines.delete(name);
    this.results.delete(name);
    logger.info(`回测任务 "${name}" 已删除`);
  }
  
  generateReport(name) {
    const results = this.getResults(name);
    if (!results) {
      throw new Error(`回测结果 "${name}" 不存在`);
    }
    
    return {
      summary: {
        initialCapital: results.initialCapital,
        finalValue: results.finalValue,
        totalReturn: (results.totalReturn * 100).toFixed(2) + '%',
        annualizedReturn: (results.annualizedReturn * 100).toFixed(2) + '%',
        sharpeRatio: results.sharpeRatio.toFixed(4),
        maxDrawdown: (results.maxDrawdown * 100).toFixed(2) + '%',
        totalTrades: results.totalTrades,
        winRate: (results.winRate * 100).toFixed(2) + '%'
      },
      performance: results.returns,
      trades: results.trades
    };
  }
}

const backtestManager = new BacktestManager();

module.exports = {
  BacktestEngine,
  BacktestManager,
  backtestManager
};