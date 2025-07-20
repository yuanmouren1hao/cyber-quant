/**
 * 移动平均策略
 * 基于双移动平均线的交叉信号进行交易
 */

const Strategy = require('./base');
const logger = require('../utils/logger');

class MovingAverageStrategy extends Strategy {
  constructor(options, dataProvider) {
    super(options, dataProvider);
    
    this.shortPeriod = this.parameters.shortPeriod || 5;
    this.longPeriod = this.parameters.longPeriod || 20;
    this.tradeAmount = this.parameters.tradeAmount || 0.1;
    this.lastSignal = new Map();
    
    logger.info(`移动平均策略初始化: 短周期=${this.shortPeriod}, 长周期=${this.longPeriod}`);
  }
  
  onData(data) {
    if (data.close) {
      this.analyzeSignal(data);
    }
  }
  
  analyzeSignal(data) {
    const symbol = data.symbol;
    const shortMA = this.calculateMA(symbol, this.shortPeriod);
    const longMA = this.calculateMA(symbol, this.longPeriod);
    
    if (!shortMA || !longMA) {
      return;
    }
    
    const currentPrice = data.close;
    const lastSignal = this.lastSignal.get(symbol);
    
    if (shortMA > longMA && (!lastSignal || lastSignal !== 'buy')) {
      this.generateSignal(
        symbol,
        'buy',
        currentPrice,
        this.tradeAmount,
        `金叉信号: 短MA(${shortMA.toFixed(4)}) > 长MA(${longMA.toFixed(4)})`
      );
      this.lastSignal.set(symbol, 'buy');
    }
    
    if (shortMA < longMA && (!lastSignal || lastSignal !== 'sell')) {
      this.generateSignal(
        symbol,
        'sell',
        currentPrice,
        this.tradeAmount,
        `死叉信号: 短MA(${shortMA.toFixed(4)}) < 长MA(${longMA.toFixed(4)})`
      );
      this.lastSignal.set(symbol, 'sell');
    }
  }
}

module.exports = MovingAverageStrategy;