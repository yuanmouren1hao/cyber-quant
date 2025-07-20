/**
 * 回测引擎
 * 提供策略回测功能
 */

const EventEmitter = require('events');
const logger = require('../utils/logger');

class BacktestEngine extends EventEmitter {
  constructor(options = {}) {
    super();
    this.initialCapital = options.initialCapital || 10000;
    this.commission = options.commission || 0.001;
    this.slippage = options.slippage || 0.0001;
    
    this.portfolio = {
      cash: this.initialCapital,
      positions: new Map(),
      totalValue: this.initialCapital,
      returns: [],
      trades: []
    };
    
    this.isRunning = false;
    this.currentTime = null;
    this.dataIndex = 0;
  }
  
  async runBacktest(strategy, historicalData, startDate, endDate) {
    logger.info('开始回测...');
    this.emit('backtest:started');
    
    try {
      this.isRunning = true;
      this.resetPortfolio();
      
      const filteredData = this.filterDataByDateRange(historicalData, startDate, endDate);
      
      for (let i = 0; i < filteredData.length; i++) {
        this.dataIndex = i;
        const dataPoint = filteredData[i];
        this.currentTime = dataPoint.timestamp;
        
        await this.processDataPoint(strategy, dataPoint);
        this.updatePortfolioValue(dataPoint);
        
        if (i % 1000 === 0) {
          this.emit('backtest:progress', {
            progress: (i / filteredData.length) * 100,
            currentTime: this.currentTime
          });
        }
      }
      
      const results = this.calculateResults();
      this.isRunning = false;
      
      logger.info('回测完成');
      this.emit('backtest:completed', results);
      
      return results;
    } catch (error) {
      this.isRunning = false;
      logger.error('回测失败:', error);
      this.emit('backtest:error', error);
      throw error;
    }
  }
  
  resetPortfolio() {
    this.portfolio = {
      cash: this.initialCapital,
      positions: new Map(),
      totalValue: this.initialCapital,
      returns: [],
      trades: []
    };
  }
  
  filterDataByDateRange(data, startDate, endDate) {
    return data.filter(item => {
      const timestamp = new Date(item.timestamp);
      return timestamp >= new Date(startDate) && timestamp <= new Date(endDate);
    });
  }
  
  async processDataPoint(strategy, dataPoint) {
    strategy.onData(dataPoint);
    
    const signals = strategy.getAllSignals();
    for (const signal of signals) {
      if (signal.timestamp === dataPoint.timestamp) {
        await this.executeSignal(signal, dataPoint);
      }
    }
  }
  
  async executeSignal(signal, dataPoint) {
    const { symbol, direction, amount, price } = signal;
    
    const adjustedPrice = this.applySlippage(price, direction);
    const cost = amount * adjustedPrice;
    const commissionCost = cost * this.commission;
    
    if (direction === 'buy') {
      const totalCost = cost + commissionCost;
      if (this.portfolio.cash >= totalCost) {
        this.portfolio.cash -= totalCost;
        
        if (!this.portfolio.positions.has(symbol)) {
          this.portfolio.positions.set(symbol, { amount: 0, avgPrice: 0 });
        }
        
        const position = this.portfolio.positions.get(symbol);
        const newAmount = position.amount + amount;
        const newAvgPrice = ((position.amount * position.avgPrice) + (amount * adjustedPrice)) / newAmount;
        
        position.amount = newAmount;
        position.avgPrice = newAvgPrice;
        
        this.recordTrade(symbol, direction, amount, adjustedPrice, commissionCost);
      }
    } else if (direction === 'sell') {
      const position = this.portfolio.positions.get(symbol);
      if (position && position.amount >= amount) {
        const revenue = (amount * adjustedPrice) - commissionCost;
        this.portfolio.cash += revenue;
        
        position.amount -= amount;
        if (position.amount === 0) {
          this.portfolio.positions.delete(symbol);
        }
        
        this.recordTrade(symbol, direction, amount, adjustedPrice, commissionCost);
      }
    }
  }
  
  applySlippage(price, direction) {
    const slippageAmount = price * this.slippage;
    return direction === 'buy' ? price + slippageAmount : price - slippageAmount;
  }
  
  recordTrade(symbol, direction, amount, price, commission) {
    const trade = {
      timestamp: this.currentTime,
      symbol,
      direction,
      amount,
      price,
      commission,
      value: amount * price
    };
    
    this.portfolio.trades.push(trade);
    logger.debug('记录交易:', trade);
  }
  
  updatePortfolioValue(dataPoint) {
    let positionsValue = 0;
    
    for (const [symbol, position] of this.portfolio.positions.entries()) {
      if (symbol === dataPoint.symbol) {
        positionsValue += position.amount * dataPoint.close;
      }
    }
    
    this.portfolio.totalValue = this.portfolio.cash + positionsValue;
    
    const returnRate = (this.portfolio.totalValue - this.initialCapital) / this.initialCapital;
    this.portfolio.returns.push({
      timestamp: this.currentTime,
      totalValue: this.portfolio.totalValue,
      returnRate: returnRate
    });
  }
  
  calculateResults() {
    const returns = this.portfolio.returns;
    if (returns.length === 0) {
      return null;
    }
    
    const finalValue = returns[returns.length - 1].totalValue;
    const totalReturn = (finalValue - this.initialCapital) / this.initialCapital;
    
    const dailyReturns = returns.map((r, i) => {
      if (i === 0) return 0;
      return (r.totalValue - returns[i - 1].totalValue) / returns[i - 1].totalValue;
    }).slice(1);
    
    const avgDailyReturn = dailyReturns.reduce((sum, r) => sum + r, 0) / dailyReturns.length;
    const volatility = Math.sqrt(dailyReturns.reduce((sum, r) => sum + Math.pow(r - avgDailyReturn, 2), 0) / dailyReturns.length);
    
    const sharpeRatio = volatility > 0 ? avgDailyReturn / volatility : 0;
    
    let maxDrawdown = 0;
    let peak = this.initialCapital;
    
    for (const point of returns) {
      if (point.totalValue > peak) {
        peak = point.totalValue;
      }
      const drawdown = (peak - point.totalValue) / peak;
      if (drawdown > maxDrawdown) {
        maxDrawdown = drawdown;
      }
    }
    
    return {
      initialCapital: this.initialCapital,
      finalValue: finalValue,
      totalReturn: totalReturn,
      annualizedReturn: totalReturn * (365 / returns.length),
      sharpeRatio: sharpeRatio,
      maxDrawdown: maxDrawdown,
      totalTrades: this.portfolio.trades.length,
      winRate: this.calculateWinRate(),
      returns: returns,
      trades: this.portfolio.trades
    };
  }
  
  calculateWinRate() {
    const trades = this.portfolio.trades;
    if (trades.length === 0) return 0;
    
    const winningTrades = trades.filter(trade => {
      // 简化的盈利计算
      return trade.direction === 'sell';
    }).length;
    
    return winningTrades / trades.length;
  }
}

module.exports = BacktestEngine;