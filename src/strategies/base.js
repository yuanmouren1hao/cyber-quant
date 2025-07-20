/**
 * 策略基类
 * 提供所有交易策略的基础结构和通用功能
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

/**
 * 策略基类
 */
class Strategy extends EventEmitter {
  constructor(options, dataProvider) {
    super();
    this.name = options.name || 'unnamed_strategy';
    this.description = options.description || '无描述';
    this.symbols = options.symbols || [];
    this.parameters = options.parameters || {};
    this.dataProvider = dataProvider;
    this.isRunning = false;
    this.positions = new Map();
    this.signals = new Map();
    this.priceHistory = new Map();
    
    this.validateConfig();
    logger.info(`策略 [${this.name}] 初始化完成`);
  }
  
  validateConfig() {
    if (!this.symbols || this.symbols.length === 0) {
      throw new Error(`策略 [${this.name}] 未配置交易对`);
    }
    if (!this.dataProvider) {
      throw new Error(`策略 [${this.name}] 未配置数据提供者`);
    }
  }
  
  async start() {
    if (this.isRunning) {
      logger.warn(`策略 [${this.name}] 已经在运行中`);
      return;
    }
    
    logger.info(`正在启动策略 [${this.name}]...`);
    this.emit('strategy:starting', { name: this.name });
    
    try {
      await this.subscribeMarketData();
      this.setupEventListeners();
      
      this.isRunning = true;
      logger.info(`策略 [${this.name}] 启动成功`);
      this.emit('strategy:started', { name: this.name });
    } catch (error) {
      logger.error(`策略 [${this.name}] 启动失败:`, error);
      this.emit('strategy:error', { name: this.name, error });
      throw error;
    }
  }
  
  async stop() {
    if (!this.isRunning) {
      logger.warn(`策略 [${this.name}] 当前未运行`);
      return;
    }
    
    logger.info(`正在停止策略 [${this.name}]...`);
    this.emit('strategy:stopping', { name: this.name });
    
    try {
      await this.unsubscribeMarketData();
      this.removeEventListeners();
      
      this.isRunning = false;
      logger.info(`策略 [${this.name}] 已停止`);
      this.emit('strategy:stopped', { name: this.name });
    } catch (error) {
      logger.error(`策略 [${this.name}] 停止失败:`, error);
      this.emit('strategy:error', { name: this.name, error });
      throw error;
    }
  }
  
  async subscribeMarketData() {
    for (const symbol of this.symbols) {
      await this.dataProvider.subscribe(symbol, 'ticker');
      await this.dataProvider.subscribe(symbol, 'kline');
    }
  }
  
  async unsubscribeMarketData() {
    for (const symbol of this.symbols) {
      await this.dataProvider.unsubscribe(symbol, 'ticker');
      await this.dataProvider.unsubscribe(symbol, 'kline');
    }
  }
  
  setupEventListeners() {
    this.dataProvider.on('ticker', this.onTicker.bind(this));
    this.dataProvider.on('kline', this.onKline.bind(this));
  }
  
  removeEventListeners() {
    this.dataProvider.removeListener('ticker', this.onTicker.bind(this));
    this.dataProvider.removeListener('kline', this.onKline.bind(this));
  }
  
  onTicker(data) {
    if (this.symbols.includes(data.symbol)) {
      this.onData(data);
    }
  }
  
  onKline(data) {
    if (this.symbols.includes(data.symbol)) {
      if (!this.priceHistory.has(data.symbol)) {
        this.priceHistory.set(data.symbol, []);
      }
      this.priceHistory.get(data.symbol).push(data);
      this.onData(data);
    }
  }
  
  onData(data) {
    throw new Error('onData() 方法必须在子类中实现');
  }
  
  generateSignal(symbol, direction, price, amount, reason = '') {
    const signal = {
      strategyName: this.name,
      symbol,
      direction,
      price,
      amount,
      reason,
      timestamp: Date.now()
    };
    
    this.signals.set(symbol, signal);
    logger.info(`策略 [${this.name}] 生成信号:`, signal);
    this.emit('strategy:signal', signal);
    
    return signal;
  }
  
  getPriceHistory(symbol, count = 100) {
    const history = this.priceHistory.get(symbol) || [];
    return history.slice(-count);
  }
  
  calculateMA(symbol, period) {
    const history = this.getPriceHistory(symbol, period);
    if (history.length < period) {
      return null;
    }
    
    const sum = history.slice(-period).reduce((acc, candle) => acc + candle.close, 0);
    return sum / period;
  }
}

module.exports = Strategy;